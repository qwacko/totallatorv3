import {
	createJournalDBCore,
	type CreateCombinedTransactionType,
	type CreateJournalDBCoreType,
	type JournalFilterSchemaType
} from '$lib/schema/journalSchema';
import { getTableColumns, eq, and, sql, inArray } from 'drizzle-orm';
import type { DBType } from '../db';
import { account, journalEntry, bill, budget, category, tag, transaction } from '../schema';
import { journalFilterToQuery } from './helpers/journalFilterToQuery';
import { labelActions } from './labelActions';
import { updatedTime } from './helpers/updatedTime';
import { nanoid } from 'nanoid';
import { expandDate } from './helpers/expandDate';
import { accountGetOrCreateLinkedItems } from './helpers/accountGetOrCreateLinkedItems';
import { accountActions } from './accountActions';
import { tActions } from './tActions';
import { seedTransactionData } from './helpers/seedTransactionData';
import { journalFilterToOrderBy } from './helpers/journalFilterToOrderBy';
import { logging } from '$lib/server/logging';

export const journalActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.journalEntry.findFirst({ where: eq(journalEntry.id, id) }).execute();
	},
	count: async (db: DBType, filter?: JournalFilterSchemaType) => {
		const count = await db
			.select({ count: sql<number>`count(${journalEntry.id})`.mapWith(Number) })
			.from(journalEntry)
			.where(and(...(filter ? journalFilterToQuery(filter) : [])))
			.execute();

		return count[0].count;
	},
	list: async ({ db, filter }: { db: DBType; filter: JournalFilterSchemaType }) => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;
		const journals = await db
			.select({
				...getTableColumns(journalEntry),
				tagTitle: tag.title,
				billTitle: bill.title,
				budgetTitle: budget.title,
				categoryTitle: category.title
			})
			.from(journalEntry)
			.leftJoin(account, eq(journalEntry.accountId, account.id))
			.leftJoin(bill, eq(journalEntry.billId, bill.id))
			.leftJoin(budget, eq(journalEntry.accountId, budget.id))
			.leftJoin(category, eq(journalEntry.categoryId, category.id))
			.leftJoin(tag, eq(journalEntry.accountId, tag.id))
			.where(and(...journalFilterToQuery(restFilter)))
			.orderBy(...journalFilterToOrderBy({ orderBy }))
			.offset(page * pageSize)
			.limit(pageSize)
			.execute();

		return journals;
	},
	create: async (dbOuter: DBType, transactionId: string, journalData: CreateJournalDBCoreType) => {
		const processedJournalData = createJournalDBCore.parse(journalData);
		const { labels, ...restJournalData } = processedJournalData;
		const id = nanoid();
		await dbOuter.transaction(async (db) => {
			await db
				.insert(journalEntry)
				.values({
					id,
					transactionId,
					...restJournalData,
					...updatedTime(),
					...expandDate(restJournalData.date)
				})
				.execute();

			if (labels) {
				await Promise.all(
					labels.map(async (label) => {
						await labelActions.createLink(db, { journalId: id, labelId: label });
					})
				);
			}
		});
	},
	createTransactionJournals: async ({
		db: dbParam,
		journalEntries
	}: {
		db: DBType;
		journalEntries: CreateCombinedTransactionType;
	}) => {
		await dbParam.transaction(async (db) => {
			const transactionId = nanoid();
			await db
				.insert(transaction)
				.values({
					id: transactionId,
					...updatedTime()
				})
				.execute();

			await Promise.all(
				journalEntries.map(async (journalEntry) => {
					const linkedItems = await accountGetOrCreateLinkedItems(db, journalEntry);
					await journalActions.create(db, transactionId, {
						...journalEntry,
						...linkedItems
					});
				})
			);
		});
	},
	createManyTransactionJournals: async ({
		db,
		journalEntries
	}: {
		db: DBType;
		journalEntries: CreateCombinedTransactionType[];
	}) => {
		await db.transaction(async (db) => {
			await Promise.all(
				journalEntries.map(async (journalEntry) => {
					await journalActions.createTransactionJournals({ db, journalEntries: journalEntry });
				})
			);
		});
	},
	hardDeleteTransactions: async (db: DBType, transactionIds: string[]) => {
		await db.transaction(async (db) => {
			await db
				.delete(journalEntry)
				.where(inArray(journalEntry.transactionId, transactionIds))
				.execute();
			await db.delete(transaction).where(inArray(transaction.id, transactionIds)).execute();
		});
	},
	seed: async (db: DBType, count: number) => {
		const { data: assetLiabilityAccounts } = await accountActions.list({
			db,
			filter: { type: ['asset', 'liability'], allowUpdate: true, pageSize: 10000 }
		});
		const { data: incomeAccounts } = await accountActions.list({
			db,
			filter: { type: ['income'], allowUpdate: true, pageSize: 10000 }
		});
		const { data: expenseAccounts } = await accountActions.list({
			db,
			filter: { type: ['expense'], allowUpdate: true, pageSize: 10000 }
		});
		const { data: bills } = await tActions.bill.list({
			db,
			filter: { allowUpdate: true, pageSize: 10000 }
		});
		const { data: budgets } = await tActions.budget.list({
			db,
			filter: { allowUpdate: true, pageSize: 10000 }
		});
		const { data: categories } = await tActions.category.list({
			db,
			filter: { allowUpdate: true, pageSize: 10000 }
		});
		const { data: tags } = await tActions.tag.list({
			db,
			filter: { allowUpdate: true, pageSize: 10000 }
		});
		const { data: labels } = await tActions.label.list({
			db,
			filter: { allowUpdate: true, pageSize: 10000 }
		});
		logging.info('Complete Label List : ', labels);
		const transactionsForCreation = Array(count)
			.fill(0)
			.map(() =>
				seedTransactionData({
					assetLiabilityIds: assetLiabilityAccounts.map(({ id }) => id),
					incomeIds: incomeAccounts.map(({ id }) => id),
					expenseIds: expenseAccounts.map(({ id }) => id),
					billIds: bills.map(({ id }) => id),
					budgetIds: budgets.map(({ id }) => id),
					categoryIds: categories.map(({ id }) => id),
					tagIds: tags.map(({ id }) => id),
					labelIds: labels.map(({ id }) => id)
				})
			);

		await db.transaction(async (db) => {
			await journalActions.createManyTransactionJournals({
				db,
				journalEntries: transactionsForCreation
			});
		});
	}
};
