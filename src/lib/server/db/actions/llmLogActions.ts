import { and, avg, count, desc, eq, gte, lte } from 'drizzle-orm';
import type { DBType } from '../db';
import { llmLogs, llmSettings } from '../postgres/schema';
import { dbExecuteLogger } from '../dbLogger';

export type LLMLogFilterType = {
	page?: number;
	pageSize?: number;
	status?: 'SUCCESS' | 'ERROR';
	llmSettingsId?: string;
	relatedJournalId?: string;
	dateFrom?: string;
	dateTo?: string;
};

export const llmLogActions = {
	list: async ({ db, filter = {} }: { db: DBType; filter?: LLMLogFilterType }) => {
		const {
			page = 0,
			pageSize = 50,
			status,
			llmSettingsId,
			relatedJournalId,
			dateFrom,
			dateTo
		} = filter;

		// Build where conditions
		const conditions = [];

		if (status) {
			conditions.push(eq(llmLogs.status, status));
		}

		if (llmSettingsId) {
			conditions.push(eq(llmLogs.llmSettingsId, llmSettingsId));
		}

		if (relatedJournalId) {
			conditions.push(eq(llmLogs.relatedJournalId, relatedJournalId));
		}

		if (dateFrom) {
			conditions.push(gte(llmLogs.timestamp, new Date(dateFrom)));
		}

		if (dateTo) {
			conditions.push(lte(llmLogs.timestamp, new Date(dateTo)));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Get paginated logs
		const logs = await dbExecuteLogger(
			db
				.select({
					id: llmLogs.id,
					timestamp: llmLogs.timestamp,
					llmSettingsId: llmLogs.llmSettingsId,
					requestPayload: llmLogs.requestPayload,
					responsePayload: llmLogs.responsePayload,
					durationMs: llmLogs.durationMs,
					status: llmLogs.status,
					relatedJournalId: llmLogs.relatedJournalId,
					llmSettingsTitle: llmSettings.title,
					llmSettingsApiUrl: llmSettings.apiUrl
				})
				.from(llmLogs)
				.leftJoin(llmSettings, eq(llmLogs.llmSettingsId, llmSettings.id))
				.where(whereClause)
				.orderBy(desc(llmLogs.timestamp))
				.limit(pageSize)
				.offset(page * pageSize),
			'LLM Log Actions - List'
		);

		// Get total count
		const countResult = await dbExecuteLogger(
			db
				.select({ count: count(llmLogs.id) })
				.from(llmLogs)
				.where(whereClause),
			'LLM Log Actions - Count'
		);

		const totalCount = countResult[0]?.count || 0;
		const pageCount = Math.ceil(totalCount / pageSize);

		return {
			data: logs,
			pagination: {
				page,
				pageSize,
				totalCount,
				pageCount
			}
		};
	},

	getById: async ({ db, id }: { db: DBType; id: string }) => {
		const results = await dbExecuteLogger(
			db
				.select({
					id: llmLogs.id,
					timestamp: llmLogs.timestamp,
					llmSettingsId: llmLogs.llmSettingsId,
					requestPayload: llmLogs.requestPayload,
					responsePayload: llmLogs.responsePayload,
					durationMs: llmLogs.durationMs,
					status: llmLogs.status,
					relatedJournalId: llmLogs.relatedJournalId,
					llmSettingsTitle: llmSettings.title,
					llmSettingsApiUrl: llmSettings.apiUrl
				})
				.from(llmLogs)
				.leftJoin(llmSettings, eq(llmLogs.llmSettingsId, llmSettings.id))
				.where(eq(llmLogs.id, id))
				.limit(1),
			'LLM Log Actions - Get By ID'
		);

		return results[0] || null;
	},

	deleteOlderThan: async ({ db, days }: { db: DBType; days: number }) => {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - days);

		const result = await dbExecuteLogger(
			db.delete(llmLogs).where(lte(llmLogs.timestamp, cutoffDate)),
			'LLM Log Actions - Delete Older Than'
		);

		return result;
	},

	getStats: async ({
		db,
		llmSettingsId,
		days = 30
	}: {
		db: DBType;
		llmSettingsId?: string;
		days?: number;
	}) => {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - days);

		const conditions = [gte(llmLogs.timestamp, cutoffDate)];

		if (llmSettingsId) {
			conditions.push(eq(llmLogs.llmSettingsId, llmSettingsId));
		}

		const stats = await dbExecuteLogger(
			db
				.select({
					totalCalls: count(llmLogs.id),
					avgDuration: avg(llmLogs.durationMs)
				})
				.from(llmLogs)
				.where(and(...conditions)),
			'LLM Log Actions - Get Stats'
		);

		// Get success and error counts separately
		const successStats = await dbExecuteLogger(
			db
				.select({ successCalls: count(llmLogs.id) })
				.from(llmLogs)
				.where(and(...conditions, eq(llmLogs.status, 'SUCCESS'))),
			'LLM Log Actions - Success Stats'
		);

		const errorStats = await dbExecuteLogger(
			db
				.select({ errorCalls: count(llmLogs.id) })
				.from(llmLogs)
				.where(and(...conditions, eq(llmLogs.status, 'ERROR'))),
			'LLM Log Actions - Error Stats'
		);

		return {
			totalCalls: stats[0]?.totalCalls || 0,
			successCalls: successStats[0]?.successCalls || 0,
			errorCalls: errorStats[0]?.errorCalls || 0,
			avgDuration: stats[0]?.avgDuration || 0
		};
	}
};
