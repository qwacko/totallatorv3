import { eq, sql } from 'drizzle-orm';
import type { DBType } from '../db';
import { journalExtendedView } from '../postgres/schema';
import { getMaterializedViewConfig } from 'drizzle-orm/pg-core';

let refreshRequired = true;

export const journalMaterializedViewActions = {
	initialize: async (db: DBType) => {
		await db.execute(sql`drop materialized view if exists ${journalExtendedView}`);
		await db.execute(
			sql`create materialized view ${journalExtendedView} as ${
				getMaterializedViewConfig(journalExtendedView).query
			}`
		);
	},
	refresh: async ({ db, logStats = false }: { db: DBType; logStats: boolean }) => {
		const startTime = Date.now();

		await db.refreshMaterializedView(journalExtendedView).concurrently();

		const endTime = Date.now();
		if (logStats) {
			console.log(`Refreshed ${journalExtendedView} in ${endTime - startTime}ms`);
		}
	},
	conditionalRefresh: async ({ db, logStats = false }: { db: DBType; logStats: boolean }) => {
		if (refreshRequired) {
			await journalMaterializedViewActions.refresh({ db, logStats });
			refreshRequired = false;
		}
	},
	setRefreshRequired: () => {
		refreshRequired = true;
	},
	getById: async (db: DBType, id: string) => {
		return db.select().from(journalExtendedView).where(eq(journalExtendedView.id, id)).execute();
	}
	// count: async (db: DBType, filter?: JournalFilterSchemaType) => {
	// 	const countQueryCore = db
	// 		.select({ count: count(journalEntry.id) })
	// 		.from(journalEntry)
	// 		.leftJoin(account, eq(journalEntry.accountId, account.id))
	// 		.leftJoin(bill, eq(journalEntry.billId, bill.id))
	// 		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
	// 		.leftJoin(category, eq(journalEntry.categoryId, category.id))
	// 		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
	// 		.where(and(...(filter ? await journalFilterToQuery(db, filter) : [sql`true`])));

	// 	const countResult = await countQueryCore.execute();

	// 	return countResult[0].count;
	// },
	// sum: async (db: DBType, filter?: JournalFilterSchemaType) => {
	// 	const countQueryCore = db
	// 		.select({ sum: sum(journalEntry.amount).mapWith(Number) })
	// 		.from(journalEntry)
	// 		.leftJoin(account, eq(journalEntry.accountId, account.id))
	// 		.leftJoin(bill, eq(journalEntry.billId, bill.id))
	// 		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
	// 		.leftJoin(category, eq(journalEntry.categoryId, category.id))
	// 		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
	// 		.where(and(...(filter ? await journalFilterToQuery(db, filter) : [])));

	// 	const count = await countQueryCore.execute();

	// 	return count[0].sum;
	// },
	// summary: async ({
	// 	db,
	// 	filter,
	// 	startDate,
	// 	endDate
	// }: {
	// 	db: DBType;
	// 	filter?: JournalFilterSchemaType;
	// 	startDate?: string;
	// 	endDate?: string;
	// }) => {
	// 	await streamingDelay();
	// 	await testingDelay();

	// 	const startDate12Months = new Date();
	// 	startDate12Months.setMonth(startDate12Months.getMonth() - 12 + 1);
	// 	const startLast12YearMonth = startDate12Months.toISOString().slice(0, 7);
	// 	const endLast12YearMonth = new Date().toISOString().slice(0, 7);

	// 	const commonSummary = {
	// 		count: count(journalEntry.id),
	// 		sum: sum(journalEntry.amount).mapWith(Number),
	// 		sum12Months:
	// 			sql`sum(CASE WHEN ${journalEntry.yearMonth} >= ${startLast12YearMonth} AND ${journalEntry.yearMonth} <= ${endLast12YearMonth} then ${journalEntry.amount} else 0 END)`.mapWith(
	// 				Number
	// 			),
	// 		sum12MonthsWithoutTransfer:
	// 			sql`sum(CASE WHEN ${journalEntry.yearMonth} >= ${startLast12YearMonth} AND ${journalEntry.yearMonth} <= ${endLast12YearMonth} AND ${journalEntry.transfer} <> true then ${journalEntry.amount} else 0 END)`.mapWith(
	// 				Number
	// 			),
	// 		sumWithoutTransfer:
	// 			sql`sum(CASE WHEN ${journalEntry.transfer} <> true then ${journalEntry.amount} else 0 END)`.mapWith(
	// 				Number
	// 			),
	// 		average: sql`avg(${journalEntry.amount})`.mapWith(Number),
	// 		earliest: sql`min(${journalEntry.dateText})`.mapWith(journalEntry.dateText),
	// 		latest: sql`max(${journalEntry.dateText})`.mapWith(journalEntry.dateText),
	// 		lastUpdated: sql`max(${journalEntry.updatedAt})`.mapWith(journalEntry.updatedAt)
	// 	} satisfies Record<string, SQL<unknown> | AnyPgColumn>;

	// 	const summaryQueryCore = db
	// 		.select(commonSummary)
	// 		.from(journalEntry)
	// 		.leftJoin(account, eq(journalEntry.accountId, account.id))
	// 		.leftJoin(bill, eq(journalEntry.billId, bill.id))
	// 		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
	// 		.leftJoin(category, eq(journalEntry.categoryId, category.id))
	// 		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
	// 		.where(and(...(filter ? await journalFilterToQuery(db, filter) : [])));

	// 	const tagsQuery = db
	// 		.select({
	// 			id: tag.id,
	// 			title: tag.title,
	// 			...commonSummary
	// 		})
	// 		.from(journalEntry)
	// 		.leftJoin(account, eq(journalEntry.accountId, account.id))
	// 		.leftJoin(bill, eq(journalEntry.billId, bill.id))
	// 		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
	// 		.leftJoin(category, eq(journalEntry.categoryId, category.id))
	// 		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
	// 		.where(and(...(filter ? await journalFilterToQuery(db, filter) : [])))
	// 		.groupBy(tag.id, tag.title)
	// 		.execute();

	// 	const categoriesQuery = db
	// 		.select({
	// 			id: category.id,
	// 			title: category.title,
	// 			...commonSummary
	// 		})
	// 		.from(journalEntry)
	// 		.leftJoin(account, eq(journalEntry.accountId, account.id))
	// 		.leftJoin(bill, eq(journalEntry.billId, bill.id))
	// 		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
	// 		.leftJoin(category, eq(journalEntry.categoryId, category.id))
	// 		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
	// 		.where(and(...(filter ? await journalFilterToQuery(db, filter) : [])))
	// 		.groupBy(category.id, category.title)
	// 		.execute();

	// 	const billsQuery = db
	// 		.select({
	// 			id: bill.id,
	// 			title: bill.title,
	// 			...commonSummary
	// 		})
	// 		.from(journalEntry)
	// 		.leftJoin(account, eq(journalEntry.accountId, account.id))
	// 		.leftJoin(bill, eq(journalEntry.billId, bill.id))
	// 		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
	// 		.leftJoin(category, eq(journalEntry.categoryId, category.id))
	// 		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
	// 		.where(and(...(filter ? await journalFilterToQuery(db, filter) : [])))
	// 		.groupBy(bill.id, bill.title)
	// 		.execute();

	// 	const budgetsQuery = db
	// 		.select({
	// 			id: budget.id,
	// 			title: budget.title,
	// 			...commonSummary
	// 		})
	// 		.from(journalEntry)
	// 		.leftJoin(account, eq(journalEntry.accountId, account.id))
	// 		.leftJoin(bill, eq(journalEntry.billId, bill.id))
	// 		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
	// 		.leftJoin(category, eq(journalEntry.categoryId, category.id))
	// 		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
	// 		.where(and(...(filter ? await journalFilterToQuery(db, filter) : [])))
	// 		.groupBy(budget.id, budget.title)
	// 		.execute();

	// 	const accountsQuery = db
	// 		.select({
	// 			id: account.id,
	// 			title: account.title,
	// 			...commonSummary
	// 		})
	// 		.from(journalEntry)
	// 		.leftJoin(account, eq(journalEntry.accountId, account.id))
	// 		.leftJoin(bill, eq(journalEntry.billId, bill.id))
	// 		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
	// 		.leftJoin(category, eq(journalEntry.categoryId, category.id))
	// 		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
	// 		.where(and(...(filter ? await journalFilterToQuery(db, filter) : [])))
	// 		.groupBy(account.id, account.title)
	// 		.execute();

	// 	const monthlyQueryCore = db
	// 		.select({
	// 			yearMonth: journalEntry.yearMonth,
	// 			count: count(journalEntry.id),
	// 			sum: sum(journalEntry.amount).mapWith(Number),
	// 			average: avg(journalEntry.amount).mapWith(Number),
	// 			positiveSum:
	// 				sql`SUM(CASE WHEN ${journalEntry.amount} > 0 THEN ${journalEntry.amount} ELSE 0 END)`.mapWith(
	// 					Number
	// 				),
	// 			positiveCount: sql`SUM(CASE WHEN ${journalEntry.amount} > 0 THEN 1 ELSE 0 END)`.mapWith(
	// 				Number
	// 			),
	// 			negativeSum:
	// 				sql`SUM(CASE WHEN ${journalEntry.amount} < 0 THEN ${journalEntry.amount} ELSE 0 END)`.mapWith(
	// 					Number
	// 				),
	// 			negativeCount: sql`SUM(CASE WHEN ${journalEntry.amount} < 0 THEN 1 ELSE 0 END)`.mapWith(
	// 				Number
	// 			),
	// 			positiveSumNonTransfer:
	// 				sql`SUM(CASE WHEN ${journalEntry.amount} > 0 AND ${journalEntry.transfer} = false THEN ${journalEntry.amount} ELSE 0 END)`.mapWith(
	// 					Number
	// 				),
	// 			negativeSumNonTransfer:
	// 				sql`SUM(CASE WHEN ${journalEntry.amount} < 0 AND ${journalEntry.transfer} = false THEN ${journalEntry.amount} ELSE 0 END)`.mapWith(
	// 					Number
	// 				)
	// 		})
	// 		.from(journalEntry)
	// 		.leftJoin(account, eq(journalEntry.accountId, account.id))
	// 		.leftJoin(bill, eq(journalEntry.billId, bill.id))
	// 		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
	// 		.leftJoin(category, eq(journalEntry.categoryId, category.id))
	// 		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
	// 		.where(and(...(filter ? await journalFilterToQuery(db, filter) : [])))
	// 		.groupBy(journalEntry.yearMonth);

	// 	const summaryQuery = (await summaryQueryCore.execute())[0];

	// 	const monthlyQuery = await monthlyQueryCore.execute();

	// 	const monthlySummary = getMonthlySummary({
	// 		monthlyQuery,
	// 		startDate,
	// 		endDate,
	// 		defaultValue: {
	// 			sum: 0,
	// 			average: 0,
	// 			count: 0,
	// 			negativeCount: 0,
	// 			positiveCount: 0,
	// 			negativeSum: 0,
	// 			positiveSum: 0,
	// 			runningTotal: 0,
	// 			runningCount: 0,
	// 			negativeSumNonTransfer: 0,
	// 			positiveSumNonTransfer: 0
	// 		}
	// 	});

	// 	const parsedData = summaryCacheDataSchema.parse({
	// 		...summaryQuery,
	// 		monthlySummary,
	// 		categories: await categoriesQuery,
	// 		tags: await tagsQuery,
	// 		bills: await billsQuery,
	// 		budgets: await budgetsQuery,
	// 		accounts: await accountsQuery
	// 	});

	// 	return parsedData;
	// },
	// list: async ({ db, filter }: { db: DBType; filter: JournalFilterSchemaInputType }) => {
	// 	return journalList({ db, filter });
	// },
	// listWithCommonData: async ({
	// 	db,
	// 	filter
	// }: {
	// 	db: DBType;
	// 	filter: JournalFilterSchemaInputType;
	// }) => {
	// 	const journalInformation = await journalActions.list({ db, filter });

	// 	const accountId = getCommonData('accountId', journalInformation.data);
	// 	const amount = getCommonData('amount', journalInformation.data);

	// 	//Note that the following have "undefined" as this removes the null option which isn't relevant for this functionaliy. This helps the forms work correctly.
	// 	const tagId = getCommonData('tagId', journalInformation.data) || undefined;
	// 	const categoryId = getCommonData('categoryId', journalInformation.data) || undefined;
	// 	const billId = getCommonData('billId', journalInformation.data) || undefined;
	// 	const budgetId = getCommonData('budgetId', journalInformation.data) || undefined;
	// 	const date = getCommonData('dateText', journalInformation.data);
	// 	const description = getCommonData('description', journalInformation.data);
	// 	const linked = getCommonData('linked', journalInformation.data);
	// 	const reconciled = getCommonData('reconciled', journalInformation.data);
	// 	const complete = getCommonData('complete', journalInformation.data);
	// 	const dataChecked = getCommonData('dataChecked', journalInformation.data);
	// 	const labelData = getCommonLabelData(journalInformation.data);
	// 	const otherAccountId = getCommonOtherAccountData(journalInformation.data);

	// 	const cloneData = getToFromAccountAmountData(journalInformation.data);

	// 	return {
	// 		journals: journalInformation,
	// 		common: {
	// 			accountId,
	// 			otherAccountId,
	// 			amount,
	// 			tagId,
	// 			categoryId,
	// 			billId,
	// 			budgetId,
	// 			date,
	// 			description,
	// 			linked,
	// 			reconciled,
	// 			complete,
	// 			dataChecked,
	// 			...cloneData,
	// 			...labelData
	// 		}
	// 	};
	// }
};
