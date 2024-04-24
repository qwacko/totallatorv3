import { SQL, and, avg, count, eq, sql, sum, max } from 'drizzle-orm';
import type { DBType } from '../db';
import { journalExtendedView } from '../postgres/schema/materializedViewSchema';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { materializedJournalFilterToQuery } from './helpers/journalMaterializedView/materializedJournalFilterToQuery';
import type {
	JournalFilterSchemaInputType,
	JournalFilterSchemaType,
	JournalFilterSchemaWithoutPaginationType
} from '$lib/schema/journalSchema';
import { journalMaterialisedList } from './helpers/journal/journalList';
import {
	getCommonData,
	getCommonLabelData,
	getCommonOtherAccountData,
	getToFromAccountAmountData
} from './helpers/misc/getCommonData';
import { getMonthlySummary } from './helpers/summary/getMonthlySummary';
import { summaryCacheDataSchema } from '$lib/schema/summaryCacheSchema';
import { materializedViewActions } from './materializedViewActions';
import { dbExecuteLogger } from '../dbLogger';

const logStats = true;

export const journalMaterializedViewActions = {
	getLatestUpdateDate: async ({ db }: { db: DBType }) => {
		const latestUpdateDate = await dbExecuteLogger(
			db.select({ lastUpdated: max(journalExtendedView.updatedAt) }).from(journalExtendedView),
			'Journal Materialized - Get Latest Update Date'
		);

		console.log('latestUpdateDate', latestUpdateDate[0].lastUpdated);

		return latestUpdateDate[0].lastUpdated || new Date();
	},
	getById: async (db: DBType, id: string) => {
		await materializedViewActions.conditionalRefresh({ db, logStats, items: { journals: true } });
		return dbExecuteLogger(
			db.select().from(journalExtendedView).where(eq(journalExtendedView.id, id)),
			'Journal Materialized - Get By Id'
		);
	},
	count: async (db: DBType, filter?: JournalFilterSchemaType) => {
		await materializedViewActions.conditionalRefresh({ db, logStats, items: { journals: true } });
		const countQuery = await dbExecuteLogger(
			db
				.select({ count: count(journalExtendedView.id) })
				.from(journalExtendedView)
				.where(and(...(filter ? await materializedJournalFilterToQuery(db, filter) : [sql`true`]))),
			'Journal Materialized - Count'
		);

		return countQuery[0].count;
	},
	sum: async (db: DBType, filter?: JournalFilterSchemaType) => {
		await materializedViewActions.conditionalRefresh({ db, logStats, items: { journals: true } });
		const sumQuery = await dbExecuteLogger(
			db
				.select({ sum: sum(journalExtendedView.id) })
				.from(journalExtendedView)
				.where(and(...(filter ? await materializedJournalFilterToQuery(db, filter) : [sql`true`]))),
			'Journal Materialized - Sum'
		);

		return sumQuery[0].sum;
	},
	summary: async ({
		db,
		filter,
		startDate,
		endDate
	}: {
		db: DBType;
		filter?: JournalFilterSchemaType | JournalFilterSchemaWithoutPaginationType;
		startDate?: string;
		endDate?: string;
	}) => {
		await materializedViewActions.conditionalRefresh({ db, logStats, items: { journals: true } });
		const startDate12Months = new Date();
		startDate12Months.setMonth(startDate12Months.getMonth() - 12 + 1);
		const startLast12YearMonth = startDate12Months.toISOString().slice(0, 7);
		const endLast12YearMonth = new Date().toISOString().slice(0, 7);

		const commonSummary = {
			count: count(journalExtendedView.id),
			sum: sum(journalExtendedView.amount).mapWith(Number),
			sum12Months:
				sql`sum(CASE WHEN ${journalExtendedView.yearMonth} >= ${startLast12YearMonth} AND ${journalExtendedView.yearMonth} <= ${endLast12YearMonth} then ${journalExtendedView.amount} else 0 END)`.mapWith(
					Number
				),
			sum12MonthsWithoutTransfer:
				sql`sum(CASE WHEN ${journalExtendedView.yearMonth} >= ${startLast12YearMonth} AND ${journalExtendedView.yearMonth} <= ${endLast12YearMonth} AND ${journalExtendedView.transfer} <> true then ${journalExtendedView.amount} else 0 END)`.mapWith(
					Number
				),
			sumWithoutTransfer:
				sql`sum(CASE WHEN ${journalExtendedView.transfer} <> true then ${journalExtendedView.amount} else 0 END)`.mapWith(
					Number
				),
			average: sql`avg(${journalExtendedView.amount})`.mapWith(Number),
			earliest: sql`min(${journalExtendedView.dateText})`.mapWith(journalExtendedView.dateText),
			latest: sql`max(${journalExtendedView.dateText})`.mapWith(journalExtendedView.dateText),
			lastUpdated: sql`max(${journalExtendedView.updatedAt})`.mapWith(journalExtendedView.updatedAt)
		} satisfies Record<string, SQL<unknown> | AnyPgColumn>;

		const summaryQueryCore = db
			.select(commonSummary)
			.from(journalExtendedView)
			.where(and(...(filter ? await materializedJournalFilterToQuery(db, filter) : [])));

		const tagsQuery = dbExecuteLogger(
			db
				.select({
					id: journalExtendedView.tagId,
					title: journalExtendedView.tagTitle,
					...commonSummary
				})
				.from(journalExtendedView)
				.where(and(...(filter ? await materializedJournalFilterToQuery(db, filter) : [])))
				.groupBy(journalExtendedView.tagId, journalExtendedView.tagTitle),
			'Journal Materialized - Summary - Tags'
		);

		const categoriesQuery = dbExecuteLogger(
			db
				.select({
					id: journalExtendedView.categoryId,
					title: journalExtendedView.categoryTitle,
					...commonSummary
				})
				.from(journalExtendedView)
				.where(and(...(filter ? await materializedJournalFilterToQuery(db, filter) : [])))
				.groupBy(journalExtendedView.categoryId, journalExtendedView.categoryTitle),
			'Journal Materialized - Summary - Categories'
		);

		const billsQuery = dbExecuteLogger(
			db
				.select({
					id: journalExtendedView.billId,
					title: journalExtendedView.billTitle,
					...commonSummary
				})
				.from(journalExtendedView)
				.where(and(...(filter ? await materializedJournalFilterToQuery(db, filter) : [])))
				.groupBy(journalExtendedView.billId, journalExtendedView.billTitle),
			'Journal Materialized - Summary - Bills'
		);

		const budgetsQuery = dbExecuteLogger(
			db
				.select({
					id: journalExtendedView.budgetId,
					title: journalExtendedView.budgetTitle,
					...commonSummary
				})
				.from(journalExtendedView)
				.where(and(...(filter ? await materializedJournalFilterToQuery(db, filter) : [])))
				.groupBy(journalExtendedView.budgetId, journalExtendedView.budgetTitle),
			'Journal Materialized - Summary - Budgets'
		);

		const accountsQuery = dbExecuteLogger(
			db
				.select({
					id: journalExtendedView.accountId,
					title: journalExtendedView.accountTitle,
					...commonSummary
				})
				.from(journalExtendedView)
				.where(and(...(filter ? await materializedJournalFilterToQuery(db, filter) : [])))
				.groupBy(journalExtendedView.accountId, journalExtendedView.accountTitle),
			'Journal Materialized - Summary - Accounts'
		);

		const monthlyQueryCore = db
			.select({
				yearMonth: journalExtendedView.yearMonth,
				count: count(journalExtendedView.id),
				sum: sum(journalExtendedView.amount).mapWith(Number),
				average: avg(journalExtendedView.amount).mapWith(Number),
				positiveSum:
					sql`SUM(CASE WHEN ${journalExtendedView.amount} > 0 THEN ${journalExtendedView.amount} ELSE 0 END)`.mapWith(
						Number
					),
				positiveCount:
					sql`SUM(CASE WHEN ${journalExtendedView.amount} > 0 THEN 1 ELSE 0 END)`.mapWith(Number),
				negativeSum:
					sql`SUM(CASE WHEN ${journalExtendedView.amount} < 0 THEN ${journalExtendedView.amount} ELSE 0 END)`.mapWith(
						Number
					),
				negativeCount:
					sql`SUM(CASE WHEN ${journalExtendedView.amount} < 0 THEN 1 ELSE 0 END)`.mapWith(Number),
				positiveSumNonTransfer:
					sql`SUM(CASE WHEN ${journalExtendedView.amount} > 0 AND ${journalExtendedView.transfer} = false THEN ${journalExtendedView.amount} ELSE 0 END)`.mapWith(
						Number
					),
				negativeSumNonTransfer:
					sql`SUM(CASE WHEN ${journalExtendedView.amount} < 0 AND ${journalExtendedView.transfer} = false THEN ${journalExtendedView.amount} ELSE 0 END)`.mapWith(
						Number
					)
			})
			.from(journalExtendedView)
			.where(and(...(filter ? await materializedJournalFilterToQuery(db, filter) : [])))
			.groupBy(journalExtendedView.yearMonth);

		const summaryQuery = (
			await dbExecuteLogger(summaryQueryCore, 'Journal Materialized - Summary - Summary Core')
		)[0];

		const monthlyQuery = await dbExecuteLogger(
			monthlyQueryCore,
			'Journal Materialized - Summary - Monthly Query'
		);

		const monthlySummary = getMonthlySummary({
			monthlyQuery,
			startDate,
			endDate,
			defaultValue: {
				sum: 0,
				average: 0,
				count: 0,
				negativeCount: 0,
				positiveCount: 0,
				negativeSum: 0,
				positiveSum: 0,
				runningTotal: 0,
				runningCount: 0,
				negativeSumNonTransfer: 0,
				positiveSumNonTransfer: 0
			}
		});

		const parsedData = summaryCacheDataSchema.parse({
			...summaryQuery,
			monthlySummary,
			categories: await categoriesQuery,
			tags: await tagsQuery,
			bills: await billsQuery,
			budgets: await budgetsQuery,
			accounts: await accountsQuery
		});

		return parsedData;
	},
	list: async ({
		db,
		filter,
		disableRefresh = false
	}: {
		db: DBType;
		filter: JournalFilterSchemaInputType;
		disableRefresh?: boolean;
	}) => {
		if (!disableRefresh)
			await materializedViewActions.conditionalRefresh({ db, logStats, items: { journals: true } });
		return journalMaterialisedList({ db, filter });
	},
	listWithCommonData: async ({
		db,
		filter,
		disableRefresh = false
	}: {
		db: DBType;
		filter: JournalFilterSchemaInputType;
		disableRefresh?: boolean;
	}) => {
		if (!disableRefresh)
			await materializedViewActions.conditionalRefresh({ db, logStats, items: { journals: true } });
		const journalInformation = await journalMaterializedViewActions.list({ db, filter });

		const accountId = getCommonData('accountId', journalInformation.data);
		const amount = getCommonData('amount', journalInformation.data);

		//Note that the following have "undefined" as this removes the null option which isn't relevant for this functionaliy. This helps the forms work correctly.
		const tagId = getCommonData('tagId', journalInformation.data) || undefined;
		const categoryId = getCommonData('categoryId', journalInformation.data) || undefined;
		const billId = getCommonData('billId', journalInformation.data) || undefined;
		const budgetId = getCommonData('budgetId', journalInformation.data) || undefined;
		const date = getCommonData('dateText', journalInformation.data);
		const description = getCommonData('description', journalInformation.data);
		const linked = getCommonData('linked', journalInformation.data);
		const reconciled = getCommonData('reconciled', journalInformation.data);
		const complete = getCommonData('complete', journalInformation.data);
		const dataChecked = getCommonData('dataChecked', journalInformation.data);
		const labelData = getCommonLabelData(journalInformation.data);
		const otherAccountId = getCommonOtherAccountData(journalInformation.data);

		const cloneData = getToFromAccountAmountData(journalInformation.data);

		return {
			journals: journalInformation,
			common: {
				accountId,
				otherAccountId,
				amount,
				tagId,
				categoryId,
				billId,
				budgetId,
				date,
				description,
				linked,
				reconciled,
				complete,
				dataChecked,
				...cloneData,
				...labelData
			}
		};
	}
};
