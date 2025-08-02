import { and, count, desc, eq, gte, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { journalLlmSuggestions } from '@totallator/database';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { getContextDB } from '@totallator/context';

export type CreateJournalLlmSuggestionType = {
	journalId: string;
	llmSettingsId: string;
	suggestedPayee?: string;
	suggestedDescription?: string;
	suggestedCategoryId?: string;
	suggestedTagId?: string;
	suggestedBillId?: string;
	suggestedBudgetId?: string;
	suggestedAccountId?: string;
	confidenceScore?: number;
	reasoning?: string;
	llmLogId?: string;
};

export type UpdateJournalLlmSuggestionType = {
	status?: 'pending' | 'accepted' | 'rejected' | 'superseded';
	processedBy?: string;
	processedAt?: Date;
};

export const journalLlmSuggestionActions = {
	create: async ({ data }: { data: CreateJournalLlmSuggestionType }) => {
		const db = getContextDB();
		const id = nanoid();

		// Mark any existing suggestions for this journal as superseded
		await dbExecuteLogger(
			db
				.update(journalLlmSuggestions)
				.set({
					status: 'superseded',
					processedAt: new Date()
				})
				.where(
					and(
						eq(journalLlmSuggestions.journalId, data.journalId),
						eq(journalLlmSuggestions.status, 'pending')
					)
				),
			'Journal LLM Suggestion Actions - Supersede Existing'
		);

		// Create new suggestion
		const result = await dbExecuteLogger(
			db
				.insert(journalLlmSuggestions)
				.values({
					id,
					...data
				})
				.returning(),
			'Journal LLM Suggestion Actions - Create'
		);

		return result[0];
	},

	getByJournalId: async ({
		journalId,
		includeSuperseded = false
	}: {
		journalId: string;
		includeSuperseded?: boolean;
	}) => {
		const db = getContextDB();
		const whereConditions = [eq(journalLlmSuggestions.journalId, journalId)];

		if (!includeSuperseded) {
			whereConditions.push(eq(journalLlmSuggestions.status, 'pending'));
		}

		const results = await dbExecuteLogger(
			db
				.select()
				.from(journalLlmSuggestions)
				.where(and(...whereConditions))
				.orderBy(desc(journalLlmSuggestions.createdAt)),
			'Journal LLM Suggestion Actions - Get By Journal ID'
		);

		return results;
	},

	getById: async ({ id }: { id: string }) => {
		const db = getContextDB();
		const results = await dbExecuteLogger(
			db.select().from(journalLlmSuggestions).where(eq(journalLlmSuggestions.id, id)).limit(1),
			'Journal LLM Suggestion Actions - Get By ID'
		);

		return results[0] || null;
	},

	update: async ({
		id,
		data
	}: {
		id: string;
		data: UpdateJournalLlmSuggestionType;
	}) => {
		const db = getContextDB();
		const result = await dbExecuteLogger(
			db
				.update(journalLlmSuggestions)
				.set({
					...data,
					...(data.status && data.status !== 'pending' ? { processedAt: new Date() } : {})
				})
				.where(eq(journalLlmSuggestions.id, id))
				.returning(),
			'Journal LLM Suggestion Actions - Update'
		);

		return result[0];
	},

	delete: async ({ id }: { id: string }) => {
		const db = getContextDB();
		await dbExecuteLogger(
			db.delete(journalLlmSuggestions).where(eq(journalLlmSuggestions.id, id)),
			'Journal LLM Suggestion Actions - Delete'
		);
	},

	// Get pending suggestions across multiple journals (for bulk processing)
	getPendingByJournalIds: async ({ journalIds }: { journalIds: string[] }) => {
		const db = getContextDB();
		if (journalIds.length === 0) return [];

		const results = await dbExecuteLogger(
			db
				.select()
				.from(journalLlmSuggestions)
				.where(
					and(
						eq(journalLlmSuggestions.status, 'pending'),
						inArray(journalLlmSuggestions.journalId, journalIds)
					)
				)
				.orderBy(desc(journalLlmSuggestions.createdAt)),
			'Journal LLM Suggestion Actions - Get Pending By Journal IDs'
		);

		return results;
	},

	// Statistics for monitoring
	getStats: async ({ days = 30 }: { days?: number }) => {
		const db = getContextDB();
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - days);

		const results = await dbExecuteLogger(
			db
				.select({
					status: journalLlmSuggestions.status,
					count: count(journalLlmSuggestions.id)
				})
				.from(journalLlmSuggestions)
				.where(gte(journalLlmSuggestions.createdAt, cutoffDate))
				.groupBy(journalLlmSuggestions.status),
			'Journal LLM Suggestion Actions - Get Stats'
		);

		return results;
	}
};
