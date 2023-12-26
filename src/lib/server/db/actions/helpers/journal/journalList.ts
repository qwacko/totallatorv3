import {
	journalFilterSchema,
	defaultJournalFilter,
	type JournalFilterSchemaInputType
} from '$lib/schema/journalSchema';
import { getTableColumns, eq, and, sql, inArray, sum } from 'drizzle-orm';
import type { DBType } from '../../../db';
import {
	account,
	journalEntry,
	bill,
	budget,
	category,
	tag,
	label,
	labelsToJournals,
	importTable
} from '../../../postgres/schema';
import { journalFilterToQuery } from './journalFilterToQuery';
import { journalFilterToOrderBy } from './journalFilterToOrderBy';

export const journalList = async ({
	db,
	filter
}: {
	db: DBType;
	filter: JournalFilterSchemaInputType;
}) => {
	const processedFilter = journalFilterSchema.catch(defaultJournalFilter()).parse(filter);

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
			accountGroup: account.accountGroupCombined,
			importTitle: importTable.title
		})
		.from(journalEntry)
		.leftJoin(account, eq(journalEntry.accountId, account.id))
		.leftJoin(bill, eq(journalEntry.billId, bill.id))
		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
		.leftJoin(category, eq(journalEntry.categoryId, category.id))
		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
		.leftJoin(importTable, eq(journalEntry.importId, importTable.id))
		.where(and(...(await journalFilterToQuery(restFilter))))
		.orderBy(...journalFilterToOrderBy(processedFilter))
		.offset(page * pageSize)
		.limit(pageSize);

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
		.where(and(...(await journalFilterToQuery(restFilter))))
		.orderBy(...journalFilterToOrderBy(processedFilter))
		.offset(page * pageSize)
		.limit(-1)
		.as('sumInner');

	const runningTotalPromise = db
		.select({ sum: sum(runningTotalInner.amount).mapWith(Number) })
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
		.where(and(...(await journalFilterToQuery(restFilter))))
		.execute();

	const count = resultCount[0].count;
	const pageCount = Math.max(1, Math.ceil(count / pageSize));

	const journals = await journalsPromise;

	const journalIds = journals.map((item) => item.id);

	const journalLabels = await db
		.select({ journalId: journalEntry.id, labelId: label.id, labelTitle: label.title })
		.from(journalEntry)
		.leftJoin(labelsToJournals, eq(labelsToJournals.journalId, journalEntry.id))
		.leftJoin(label, eq(label.id, labelsToJournals.labelId))
		.where(
			journalIds.length > 0 ? inArray(journalEntry.id, journalIds) : eq(journalEntry.id, 'None')
		)
		.execute();

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
		const labels = journalLabels
			.filter((item) => item.journalId === journal.id)
			.map((item) => ({ id: item.labelId, title: item.labelTitle }));

		return {
			...journal,
			total,
			otherJournals,
			labels
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
