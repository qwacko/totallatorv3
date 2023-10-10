import {
	journalFilterSchema,
	defaultJournalFilter,
	type JournalFilterSchemaInputType
} from '$lib/schema/journalSchema';
import { getTableColumns, eq, and, sql, inArray } from 'drizzle-orm';
import type { DBType } from '../../db';
import { account, journalEntry, bill, budget, category, tag } from '../../schema';
import { journalFilterToQuery } from './journalFilterToQuery';
import { journalFilterToOrderBy } from './journalFilterToOrderBy';

export const journalList = async ({
	db,
	filter
}: {
	db: DBType;
	filter: JournalFilterSchemaInputType;
}) => {
	const processedFilter = journalFilterSchema.catch(defaultJournalFilter).parse(filter);

	const { page = 0, pageSize = 10, ...restFilter } = processedFilter;

	const journalQueryCore = db
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
		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
		.leftJoin(category, eq(journalEntry.categoryId, category.id))
		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
		.where(and(...journalFilterToQuery(restFilter)))
		.orderBy(...journalFilterToOrderBy(processedFilter))
		.offset(page * pageSize)
		.limit(pageSize);

	// logging.info('Query Params : ', restFilter);
	// logging.info('Query Text : ', journalQueryCore.toSQL());
	const journalsPromise = journalQueryCore.execute();

	const runningTotalInner = db
		.select({
			amount: getTableColumns(journalEntry).amount
		})
		.from(journalEntry)
		.leftJoin(account, eq(journalEntry.accountId, account.id))
		.leftJoin(bill, eq(journalEntry.billId, bill.id))
		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
		.leftJoin(category, eq(journalEntry.categoryId, category.id))
		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
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
		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
		.leftJoin(category, eq(journalEntry.categoryId, category.id))
		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
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
};
