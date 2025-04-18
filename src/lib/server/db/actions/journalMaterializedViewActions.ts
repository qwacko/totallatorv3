import { SQL, and, avg, count, sql, sum, max, not, eq, desc } from 'drizzle-orm';
import type { DBType } from '../db';
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
import { dbExecuteLogger } from '../dbLogger';
import { journalEntry } from '../postgres/schema';
import {
	getCorrectImportCheckTable,
	getCorrectJournalTable
} from './helpers/journalMaterializedView/getCorrectJournalTable';

import { z } from 'zod';

export const journalMaterializedViewActions = {
	getLatestUpdateDate: async ({ db }: { db: DBType }) => {
		const latestUpdateDate = await dbExecuteLogger(
			db.select({ lastUpdated: max(journalEntry.updatedAt) }).from(journalEntry),
			'Journal Materialized - Get Latest Update Date'
		);

		return latestUpdateDate[0].lastUpdated || new Date();
	},
	count: async (db: DBType, filter?: JournalFilterSchemaType) => {
		const { table, target } = await getCorrectJournalTable(db);
		const countQuery = await dbExecuteLogger(
			db
				.select({ count: count(table.id) })
				.from(table)
				.where(
					and(
						...(filter
							? await materializedJournalFilterToQuery(db, filter, { target })
							: [sql`true`])
					)
				),
			'Journal Materialized - Count'
		);

		return countQuery[0].count;
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
		const { table, target } = await getCorrectJournalTable(db);

		const startDate12Months = new Date();
		startDate12Months.setMonth(startDate12Months.getMonth() - 12 + 1);
		const startLast12YearMonth = startDate12Months.toISOString().slice(0, 7);
		const endLast12YearMonth = new Date().toISOString().slice(0, 7);

		const commonSummary = {
			count: count(table.id),
			sum: sum(table.amount).mapWith(Number),
			sum12Months:
				sql`sum(CASE WHEN ${table.yearMonth} >= ${startLast12YearMonth} AND ${table.yearMonth} <= ${endLast12YearMonth} then ${table.amount} else 0 END)`.mapWith(
					Number
				),
			sum12MonthsWithoutTransfer:
				sql`sum(CASE WHEN ${table.yearMonth} >= ${startLast12YearMonth} AND ${table.yearMonth} <= ${endLast12YearMonth} AND ${table.transfer} <> true then ${table.amount} else 0 END)`.mapWith(
					Number
				),
			sumWithoutTransfer:
				sql`sum(CASE WHEN ${table.transfer} <> true then ${table.amount} else 0 END)`.mapWith(
					Number
				),
			average: sql`avg(${table.amount})`.mapWith(Number),
			earliest: sql`min(${table.dateText})`.mapWith(table.dateText),
			latest: sql`max(${table.dateText})`.mapWith(table.dateText),
			lastUpdated: sql`max(${table.updatedAt})`.mapWith(table.updatedAt)
		} satisfies Record<string, SQL<unknown> | AnyPgColumn>;

		const summaryQueryCore = db
			.select(commonSummary)
			.from(table)
			.where(
				and(...(filter ? await materializedJournalFilterToQuery(db, filter, { target }) : []))
			);

		const tagsQuery = dbExecuteLogger(
			db
				.select({
					id: table.tagId,
					title: table.tagTitle,
					...commonSummary
				})
				.from(table)
				.where(
					and(...(filter ? await materializedJournalFilterToQuery(db, filter, { target }) : []))
				)
				.groupBy(table.tagId, table.tagTitle),
			'Journal Materialized - Summary - Tags'
		);

		const categoriesQuery = dbExecuteLogger(
			db
				.select({
					id: table.categoryId,
					title: table.categoryTitle,
					...commonSummary
				})
				.from(table)
				.where(
					and(...(filter ? await materializedJournalFilterToQuery(db, filter, { target }) : []))
				)
				.groupBy(table.categoryId, table.categoryTitle),
			'Journal Materialized - Summary - Categories'
		);

		const billsQuery = dbExecuteLogger(
			db
				.select({
					id: table.billId,
					title: table.billTitle,
					...commonSummary
				})
				.from(table)
				.where(
					and(...(filter ? await materializedJournalFilterToQuery(db, filter, { target }) : []))
				)
				.groupBy(table.billId, table.billTitle),
			'Journal Materialized - Summary - Bills'
		);

		const budgetsQuery = dbExecuteLogger(
			db
				.select({
					id: table.budgetId,
					title: table.budgetTitle,
					...commonSummary
				})
				.from(table)
				.where(
					and(...(filter ? await materializedJournalFilterToQuery(db, filter, { target }) : []))
				)
				.groupBy(table.budgetId, table.budgetTitle),
			'Journal Materialized - Summary - Budgets'
		);

		const accountsQuery = dbExecuteLogger(
			db
				.select({
					id: table.accountId,
					title: table.accountTitle,
					...commonSummary
				})
				.from(table)
				.where(
					and(...(filter ? await materializedJournalFilterToQuery(db, filter, { target }) : []))
				)
				.groupBy(table.accountId, table.accountTitle),
			'Journal Materialized - Summary - Accounts'
		);

		const monthlyQueryCore = db
			.select({
				yearMonth: table.yearMonth,
				count: count(table.id),
				sum: sum(table.amount).mapWith(Number),
				average: avg(table.amount).mapWith(Number),
				positiveSum:
					sql`SUM(CASE WHEN ${table.amount} > 0 THEN ${table.amount} ELSE 0 END)`.mapWith(Number),
				positiveCount: sql`SUM(CASE WHEN ${table.amount} > 0 THEN 1 ELSE 0 END)`.mapWith(Number),
				negativeSum:
					sql`SUM(CASE WHEN ${table.amount} < 0 THEN ${table.amount} ELSE 0 END)`.mapWith(Number),
				negativeCount: sql`SUM(CASE WHEN ${table.amount} < 0 THEN 1 ELSE 0 END)`.mapWith(Number),
				positiveSumNonTransfer:
					sql`SUM(CASE WHEN ${table.amount} > 0 AND ${table.transfer} = false THEN ${table.amount} ELSE 0 END)`.mapWith(
						Number
					),
				negativeSumNonTransfer:
					sql`SUM(CASE WHEN ${table.amount} < 0 AND ${table.transfer} = false THEN ${table.amount} ELSE 0 END)`.mapWith(
						Number
					)
			})
			.from(table)
			.where(and(...(filter ? await materializedJournalFilterToQuery(db, filter, { target }) : [])))
			.groupBy(table.yearMonth);

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
		const journalInformation = await journalMaterializedViewActions.list({
			db,
			filter,
			disableRefresh
		});

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
	},
	listRecommendations: async ({
		db,
		journals,
		similarityThreshold = 0.3
	}: {
		db: DBType;
		similarityThreshold?: number;
		journals: {
			id: string;
			description: string;
			dataChecked: boolean;
			accountId: string;
			importDetail?: { dataToUse?: any } | null;
		}[];
	}): Promise<undefined | RecommendationType[]> => {
		if (journals.length !== 1) {
			return;
		}

		const targetJournal = journals[0];

		if (targetJournal.dataChecked) {
			return;
		}

		if (!targetJournal?.importDetail?.dataToUse) {
			return;
		}

		const validator = z.object({
			description: z.string()
		});

		const validated = validator.safeParse(targetJournal.importDetail.dataToUse);

		if (!validated.success) {
			return;
		}

		const description = validated.data.description;

		const { table } = await getCorrectJournalTable(db);
		const { table: importCheckTable } = await getCorrectImportCheckTable(db);

		const recommendation = await dbExecuteLogger(
			(() => {
				const sq = db
					.select({
						journalId: table.id,
						journalBillId: table.billId,
						journalBudgetId: table.budgetId,
						journalCategoryId: table.categoryId,
						journalTagId: table.tagId,
						journalAccountId: table.accountId,
						journalDescription: table.description,
						journalDate: table.date,
						journalAmount: table.amount,
						journalDataChecked: table.dataChecked,
						payeeAccountId: sql<string>`${journalEntry.accountId}`.as('payeeAccountId'),
						checkSimilarity:
							sql<number>`similarity(${importCheckTable}.${importCheckTable.description}, ${description})`.as(
								'similarity'
							),
						checkDescription: sql<string>`${importCheckTable}.${importCheckTable.description}`.as(
							'checkDescription'
						),
						searchDescription: sql<string>`${description}::text`
							.mapWith(String)
							.as('searchDescription')
					})
					.from(table)
					.leftJoin(importCheckTable, eq(table.importDetailId, importCheckTable.id))
					.leftJoin(
						journalEntry,
						and(
							eq(sql`${table}.${table.transactionId}`, journalEntry.transactionId),
							not(eq(table.id, journalEntry.id))
						)
					)
					.where(
						and(
							eq(table.accountId, targetJournal.accountId),
							eq(table.dataChecked, true),
							sql`similarity(${importCheckTable}.${importCheckTable.description}, ${description}) > ${similarityThreshold}`
						)
					)
					.as('sq');

				return db
					.selectDistinctOn([
						sq.journalBillId,
						sq.journalBudgetId,
						sq.journalTagId,
						sq.journalCategoryId,
						sq.checkDescription,
						sq.checkSimilarity,
						sq.payeeAccountId,
						sq.journalAccountId,
						sq.journalDescription
					])
					.from(sq)
					.orderBy(desc(sq.checkSimilarity))
					.limit(4);
			})()
		);

		if (recommendation.length === 0) {
			return;
		}

		return recommendation;
	}
};

export type RecommendationType = {
	journalId: string;
	journalBillId?: string;
	journalBudgetId?: string;
	journalCategoryId?: string;
	journalTagId?: string;
	journalAccountId: string;
	journalDescription: string;
	journalDate: Date;
	journalAmount: number;
	journalDataChecked: boolean;
	payeeAccountId: string;
	checkSimilarity: number;
	checkDescription: string;
	searchDescription: string;
};
