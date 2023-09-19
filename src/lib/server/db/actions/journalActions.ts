import {
	createJournalDBCore,
	type CreateCombinedTransactionType,
	type CreateJournalDBCoreType,
	type JournalFilterSchemaType
} from '$lib/schema/journalSchema';
import { getTableColumns, eq, and, asc, desc, SQL } from 'drizzle-orm';
import type { DBType } from '../db';
import { account, journalEntry, bill, budget, category, tag, transaction } from '../schema';
import { journalFilterToQuery } from './helpers/journalFilterToQuery';
import { labelActions } from './labelActions';
import { updatedTime } from './helpers/updatedTime';
import { nanoid } from 'nanoid';
import { expandDate } from './helpers/expandDate';
import { accountGetOrCreateLinkedItems } from './helpers/accountGetOrCreateLinkedItems';

const journalFilterToOrderBy = (filter: JournalFilterSchemaType): SQL<unknown>[] => {
	const { orderBy } = filter;

	if (!orderBy) {
		return [];
	}
	const processedOrderBy = orderBy.map((currentOrder) => {
		if (
			currentOrder.field === 'amount' ||
			currentOrder.field === 'complete' ||
			currentOrder.field === 'dataChecked' ||
			currentOrder.field === 'date' ||
			currentOrder.field === 'description' ||
			currentOrder.field === 'linked' ||
			currentOrder.field === 'reconciled'
		) {
			if (currentOrder.direction === 'asc') {
				return asc(journalEntry[currentOrder.field]);
			}
			return desc(journalEntry[currentOrder.field]);
		}

		return desc(journalEntry.createdAt);
	});

	return processedOrderBy;
};

export const journalActions = {
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
	}
};
