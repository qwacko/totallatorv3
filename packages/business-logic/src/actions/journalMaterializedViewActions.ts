import { and, avg, count, desc, eq, max, not, SQL, sql, sum } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import Papa from 'papaparse';
import * as z from 'zod';

import { getContextDB } from '@totallator/context';
import type { DBType } from '@totallator/database';
import { journalEntry } from '@totallator/database';
import type {
	CreateSimpleTransactionType,
	JournalFilterSchemaInputType,
	JournalFilterSchemaType,
	JournalFilterSchemaWithoutPaginationType
} from '@totallator/shared';
import { summaryCacheDataSchema, type SummaryCacheSchemaDataType } from '@totallator/shared';
import type { DownloadTypeEnumType } from '@totallator/shared';
import type { LlmReviewStatusEnumType } from '@totallator/shared';

import { getLogger } from '@/logger';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { type EnhancedRecommendationType } from '@/server/services/journalRecommendationService';

import { filterNullUndefinedAndDuplicates } from '../helpers/filterNullUndefinedAndDuplicates';
import {
	journalMaterialisedList,
	type JournalMLExpandedWithPagination
} from './helpers/journal/journalList';
import {
	getCorrectImportCheckTable,
	getCorrectJournalTable
} from './helpers/journalMaterializedView/getCorrectJournalTable';
import { materializedJournalFilterToQuery } from './helpers/journalMaterializedView/materializedJournalFilterToQuery';
import {
	getCommonData,
	getCommonLabelData,
	getCommonOtherAccountData,
	getToFromAccountAmountData,
	type GetToFromAccountAmountDataReturn
} from './helpers/misc/getCommonData';
import { getMonthlySummary } from './helpers/summary/getMonthlySummary';

export const journalMaterializedViewActions = {
	getLatestUpdateDate: async (): Promise<Date> => {
		const db = getContextDB();
		const latestUpdateDate = await dbExecuteLogger(
			db.select({ lastUpdated: max(journalEntry.updatedAt) }).from(journalEntry),
			'Journal Materialized - Get Latest Update Date'
		);

		return latestUpdateDate[0].lastUpdated || new Date();
	},
	count: async (filter?: JournalFilterSchemaType): Promise<number> => {
		const db = getContextDB();
		const { table, target } = await getCorrectJournalTable();
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
	simpleSummary: async ({
		filter
	}: {
		filter?: JournalFilterSchemaType | JournalFilterSchemaWithoutPaginationType;
	}): Promise<{
		count: number;
		sum: number;
		average: number;
		earliest: Date;
		latest: Date;
		earliestText: string;
		latestText: string;
		positiveSum: number;
		positiveCount: number;
		negativeSum: number;
		negativeCount: number;
		positiveSumNonTransfer: number;
		positiveCountNonTransfer: number;
		negativeSumNonTransfer: number;
		negativeCountNonTransfer: number;
	}> => {
		const db = getContextDB();
		const { table, target } = await getCorrectJournalTable();

		const summaryQueryCore = db
			.select({
				count: count(table.id),
				sum: sum(table.amount).mapWith(Number),
				average: sql`avg(${table.amount})`.mapWith(Number),
				earliest: sql`min(${table.date})`.mapWith(table.date),
				latest: sql`max(${table.date})`.mapWith(table.date),
				earliestText: sql`min(${table.dateText})`.mapWith(table.dateText),
				latestText: sql`max(${table.dateText})`.mapWith(table.dateText),
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
				positiveCountNonTransfer:
					sql`SUM(CASE WHEN ${table.amount} > 0 AND ${table.transfer} = false THEN 1 ELSE 0 END)`.mapWith(
						Number
					),
				negativeSumNonTransfer:
					sql`SUM(CASE WHEN ${table.amount} < 0 AND ${table.transfer} = false THEN ${table.amount} ELSE 0 END)`.mapWith(
						Number
					),
				negativeCountNonTransfer:
					sql`SUM(CASE WHEN ${table.amount} < 0 AND ${table.transfer} = false THEN 1 ELSE 0 END)`.mapWith(
						Number
					)
			})
			.from(table)
			.where(
				and(...(filter ? await materializedJournalFilterToQuery(db, filter, { target }) : []))
			);

		const summaryQuery = (
			await dbExecuteLogger(
				summaryQueryCore,
				'Journal Materialized - Simple Summary - Summary Core'
			)
		)[0];

		return summaryQuery;
	},
	summary: async ({
		filter,
		startDate,
		endDate
	}: {
		filter?: JournalFilterSchemaType | JournalFilterSchemaWithoutPaginationType;
		startDate?: string;
		endDate?: string;
	}): Promise<SummaryCacheSchemaDataType> => {
		const db = getContextDB();
		const { table, target } = await getCorrectJournalTable();

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
		filter
	}: {
		filter: JournalFilterSchemaInputType;
	}): Promise<JournalMLExpandedWithPagination> => {
		const db = getContextDB();
		return journalMaterialisedList({ db, filter });
	},
	generateCSVData: async ({
		filter,
		returnType
	}: {
		filter?: JournalFilterSchemaInputType;
		returnType: DownloadTypeEnumType;
	}): Promise<string> => {
		const journalData = await journalMaterializedViewActions.list({
			filter: { ...filter, page: 0, pageSize: 100000 }
		});

		const transactionIds = filterNullUndefinedAndDuplicates(
			journalData.data.map((item) => item.transactionId)
		);
		const journalDataToUse =
			returnType === 'import'
				? filterNullUndefinedAndDuplicates(
						transactionIds.map((currentTransactionId) =>
							journalData.data.find((item) => item.transactionId === currentTransactionId)
						)
					)
				: journalData.data;

		const preppedData = journalDataToUse.map((item, row) => {
			if (returnType === 'import') {
				const fromAccountTitle =
					item.amount > 0 ? item.otherJournals[0].accountTitle : item.accountTitle;
				const toAccountTitle =
					item.amount <= 0 ? item.otherJournals[0].accountTitle : item.accountTitle;
				const amount = item.amount > 0 ? item.amount : -1 * item.amount;

				return {
					date: item.date.toString().slice(0, 10),
					fromAccountTitle: fromAccountTitle || undefined,
					toAccountTitle: toAccountTitle || undefined,
					amount,
					description: item.description,
					billTitle: item.billTitle || undefined,
					budgetTitle: item.budgetTitle || undefined,
					categoryTitle: item.categoryTitle || undefined,
					tagTitle: item.tagTitle || undefined,
					complete: item.complete,
					dataChecked: item.dataChecked,
					reconciled: item.reconciled,
					importId: undefined,
					importDetailId: undefined,
					billId: undefined,
					budgetId: undefined,
					categoryId: undefined,
					tagId: undefined,
					fromAccountId: undefined,
					toAccountId: undefined
				} satisfies CreateSimpleTransactionType;
			}
			return {
				row,
				transactionId: item.transactionId,
				date: item.date,
				description: item.description,
				amount: item.amount,
				total: item.total,
				accountTitle: item.accountTitle,
				payeeTitle: item.otherJournals[0].accountTitle,
				billTitle: item.billTitle,
				budgetTitle: item.budgetTitle,
				categoryTitle: item.categoryTitle,
				tagTitle: item.tagTitle,
				importTitle: item.importTitle
			};
		});

		const csvData = Papa.unparse(preppedData);

		return csvData;
	},
	listWithCommonData: async ({
		filter
	}: {
		filter: JournalFilterSchemaInputType;
	}): Promise<{
		journals: JournalMLExpandedWithPagination;
		common: {
			accountId: string | undefined;
			amount: number | undefined;
			tagId: string | undefined;
			categoryId: string | undefined;
			billId: string | undefined;
			budgetId: string | undefined;
			date: string | undefined;
			description: string | undefined;
			linked: boolean | undefined;
			reconciled: boolean | undefined;
			complete: boolean | undefined;
			dataChecked: boolean | undefined;
			llmReviewStatus: LlmReviewStatusEnumType | undefined;
			otherAccountId: string | undefined;
			allLabelIds: string[];
			commonLabelIds: string[];
		} & GetToFromAccountAmountDataReturn;
	}> => {
		const journalInformation = await journalMaterializedViewActions.list({
			filter
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
		const llmReviewStatus = getCommonData('llmReviewStatus', journalInformation.data);
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
				llmReviewStatus,
				...cloneData,
				...labelData
			}
		};
	},
	listRecommendations: async ({
		journals,
		similarityThreshold = 0.3
	}: {
		similarityThreshold?: number;
		journals: {
			id: string;
			description: string;
			dataChecked: boolean;
			accountId: string;
			importDetail?: { dataToUse?: any } | null;
		}[];
	}): Promise<undefined | RecommendationType[]> => {
		const db = getContextDB();
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

		const { table } = await getCorrectJournalTable();
		const { table: importCheckTable } = await getCorrectImportCheckTable();

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
	},

	/**
	 * Get combined recommendations (similarity + LLM) for a journal entry
	 */
	listCombinedRecommendations: async ({
		journals,
		similarityThreshold = 0.3,
		includeLlmSuggestions = true
	}: {
		db: DBType;
		similarityThreshold?: number;
		includeLlmSuggestions?: boolean;
		llmSettingsId?: string;
		journals: {
			id: string;
			description: string;
			dataChecked: boolean;
			accountId: string;
			amount: number;
			date: Date;
			importDetail?: { dataToUse?: any } | null;
		}[];
	}): Promise<undefined | EnhancedRecommendationType[]> => {
		if (journals.length !== 1) {
			return;
		}

		const recommendations: EnhancedRecommendationType[] = [];

		// Get similarity-based recommendations first
		const similarityRecommendations = await journalMaterializedViewActions.listRecommendations({
			journals,
			similarityThreshold
		});

		if (similarityRecommendations) {
			// Convert existing recommendations to enhanced format
			const enhancedSimilarityRecommendations: EnhancedRecommendationType[] =
				similarityRecommendations.map((rec) => ({
					...rec,
					source: 'similarity' as const
				}));

			recommendations.push(...enhancedSimilarityRecommendations);
		}

		// Sort recommendations by confidence/similarity score (descending)
		recommendations.sort((a, b) => {
			const aScore = a.source === 'llm' ? a.llmConfidence || 0 : a.checkSimilarity;
			const bScore = b.source === 'llm' ? b.llmConfidence || 0 : b.checkSimilarity;
			return bScore - aScore;
		});

		return recommendations.length > 0 ? recommendations : undefined;
	}
};

export type RecommendationType = {
	journalId: string;
	journalBillId?: string | null;
	journalBudgetId?: string | null;
	journalCategoryId?: string | null;
	journalTagId?: string | null;
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

export type JournalSummaryType = Awaited<
	ReturnType<(typeof journalMaterializedViewActions)['summary']>
>;
