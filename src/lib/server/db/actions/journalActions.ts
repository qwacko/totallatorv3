import {
	createJournalDBCore,
	type CreateCombinedTransactionType,
	type CreateJournalDBCoreType,
	type JournalFilterSchemaType,
	type CreateJournalSchemaType,
	journalFilterSchema,
	defaultJournalFilter,
	type JournalFilterSchemaInputType
} from '$lib/schema/journalSchema';
import { getTableColumns, eq, and, sql, inArray } from 'drizzle-orm';
import type { DBType } from '../db';
import {
	account,
	journalEntry,
	bill,
	budget,
	category,
	tag,
	transaction,
	labelsToJournals
} from '../schema';
import { journalFilterToQuery } from './helpers/journalFilterToQuery';
import { labelActions } from './labelActions';
import { updatedTime } from './helpers/updatedTime';
import { nanoid } from 'nanoid';
import { expandDate } from './helpers/expandDate';
import { accountActions } from './accountActions';
import { tActions } from './tActions';
import { seedTransactionData } from './helpers/seedTransactionData';
import { journalFilterToOrderBy } from './helpers/journalFilterToOrderBy';
import { logging } from '$lib/server/logging';
import { journalGetOrCreateLinkedItems } from './helpers/accountGetOrCreateLinkedItems';

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
	list: async ({ db, filter }: { db: DBType; filter: JournalFilterSchemaInputType }) => {
		const processedFilter = journalFilterSchema.catch(defaultJournalFilter).parse(filter);

		const { page = 0, pageSize = 10, ...restFilter } = processedFilter;

		const journalsPromise = db
			.select({
				...getTableColumns(journalEntry),
				tagTitle: tag.title,
				billTitle: bill.title,
				budgetTitle: budget.title,
				categoryTitle: category.title,
				accountTitle: account.title,
				accountType: account.type,
				accountGroup: account.accountGroupCombined
			})
			.from(journalEntry)
			.leftJoin(account, eq(journalEntry.accountId, account.id))
			.leftJoin(bill, eq(journalEntry.billId, bill.id))
			.leftJoin(budget, eq(journalEntry.accountId, budget.id))
			.leftJoin(category, eq(journalEntry.categoryId, category.id))
			.leftJoin(tag, eq(journalEntry.accountId, tag.id))
			.where(and(...journalFilterToQuery(restFilter)))
			.orderBy(...journalFilterToOrderBy(processedFilter))
			.offset(page * pageSize)
			.limit(pageSize)
			.execute();

		const runningTotalInner = db
			.select({
				amount: getTableColumns(journalEntry).amount
			})
			.from(journalEntry)
			.leftJoin(account, eq(journalEntry.accountId, account.id))
			.leftJoin(bill, eq(journalEntry.billId, bill.id))
			.leftJoin(budget, eq(journalEntry.accountId, budget.id))
			.leftJoin(category, eq(journalEntry.categoryId, category.id))
			.leftJoin(tag, eq(journalEntry.accountId, tag.id))
			.where(and(...journalFilterToQuery(restFilter)))
			.orderBy(...journalFilterToOrderBy(processedFilter))
			.offset(page * pageSize)
			.limit(-1)
			.as('sumInner');

		const runningTotalPromise = db
			.select({ sum: sql<number>`sum(${runningTotalInner.amount})`.mapWith(Number) })
			.from(runningTotalInner)
			.execute();

		const resultCount = await db
			.select({
				count: sql<number>`count(${journalEntry.id})`.mapWith(Number)
			})
			.from(journalEntry)
			.leftJoin(account, eq(journalEntry.accountId, account.id))
			.leftJoin(bill, eq(journalEntry.billId, bill.id))
			.leftJoin(budget, eq(journalEntry.accountId, budget.id))
			.leftJoin(category, eq(journalEntry.categoryId, category.id))
			.leftJoin(tag, eq(journalEntry.accountId, tag.id))
			.where(and(...journalFilterToQuery(restFilter)))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		const journals = await journalsPromise;
		const runningTotal = (await runningTotalPromise)[0].sum;

		const transactionIds = journals.map((journal) => journal.transactionId);

		const transactionJournals =
			transactionIds.length > 0
				? await db
						.select({
							id: journalEntry.id,
							transactionId: journalEntry.transactionId,
							accountId: journalEntry.accountId,
							accountTitle: account.title,
							accountType: account.type,
							accountGroup: account.accountGroupCombined,
							amount: journalEntry.amount
						})
						.from(journalEntry)
						.leftJoin(account, eq(journalEntry.accountId, account.id))
						.where(inArray(journalEntry.transactionId, transactionIds))
						.execute()
				: [];

		const journalsMerged = journals.map((journal, index) => {
			const otherJournals = transactionJournals.filter(
				(x) => x.transactionId === journal.transactionId && x.id !== journal.id
			);
			const priorJournals = journals.filter((_, i) => i < index);
			const priorJournalTotal = priorJournals.reduce((prev, current) => prev + current.amount, 0);
			const total = runningTotal - priorJournalTotal;

			return {
				...journal,
				total,
				otherJournals
			};
		});

		return {
			count,
			data: journalsMerged,
			pageCount,
			page,
			pageSize,
			runningTotal
		};
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
			const { transactions, journals, labels } = await generateItemsForTransactionCreation(
				db,
				journalEntries
			);
			transactions &&
				transactions.length > 0 &&
				(await db.insert(transaction).values(transactions).execute());
			journals && journals.length > 0 && (await db.insert(journalEntry).values(journals).execute());
			labels && labels.length > 0 && (await db.insert(labelsToJournals).values(labels).execute());
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
			const itemsForCreation = await Promise.all(
				journalEntries.map(
					async (journalEntry) => await generateItemsForTransactionCreation(db, journalEntry)
				)
			);
			const transactions = itemsForCreation
				.map(({ transactions }) => transactions)
				.reduce((a, b) => [...a, ...b], []);
			const journals = itemsForCreation
				.map(({ journals }) => journals)
				.reduce((a, b) => [...a, ...b], []);
			const labels = itemsForCreation
				.map(({ labels }) => labels)
				.reduce((a, b) => [...a, ...b], []);
			const transactionChunks = splitArrayInfoChunks(transactions, 5000);
			for (const chunk of transactionChunks) {
				await db.insert(transaction).values(chunk).execute();
			}

			const journalChunks = splitArrayInfoChunks(journals, 1000);
			for (const chunk of journalChunks) {
				await db.insert(journalEntry).values(chunk).execute();
			}

			const labelChunks = splitArrayInfoChunks(labels, 1000);
			for (const chunk of labelChunks) {
				await db.insert(labelsToJournals).values(chunk).execute();
			}
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
		const startTime = Date.now();
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
		const endTime = Date.now();
		logging.info(`Seeding ${count} transactions took ${endTime - startTime}ms`);
	}
};

const splitArrayInfoChunks = <T>(array: T[], chunkSize: number) => {
	const numberChunks = Math.ceil(array.length / chunkSize);
	const chunks = Array(numberChunks)
		.fill(0)
		.map((_, i) => {
			return array.slice(i * chunkSize, (i + 1) * chunkSize);
		});

	return chunks;
};

const generateItemsForTransactionCreation = async (
	db: DBType,
	data: CreateCombinedTransactionType
) => {
	const transactionId = nanoid();
	const itemsForCreation = await Promise.all(
		data.map(async (journalData) => {
			return await generateItemsForJournalCreation(db, transactionId, journalData);
		})
	);

	return {
		transactions: [{ id: transactionId, ...updatedTime() }],
		journals: itemsForCreation.map(({ journal }) => journal),
		labels: itemsForCreation.map(({ labels }) => labels).reduce((a, b) => [...a, ...b], [])
	};
};

const generateItemsForJournalCreation = async (
	db: DBType,
	transactionId: string,
	journalData: CreateJournalSchemaType
) => {
	const linkedCorrections = await journalGetOrCreateLinkedItems(db, journalData);
	const processedJournalData = createJournalDBCore.parse(linkedCorrections);
	const { labels, ...restJournalData } = processedJournalData;
	const id = nanoid();

	const journalForCreation = {
		id,
		transactionId,
		...restJournalData,
		...updatedTime(),
		...expandDate(restJournalData.date)
	};

	const labelsForCreation = labels
		? labels.map((label) => {
				const id = nanoid();
				return { id, journalId: id, labelId: label, ...updatedTime() };
		  })
		: [];

	return { journal: journalForCreation, labels: labelsForCreation };
};
