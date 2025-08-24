import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { llmSettings } from './llm';

export const llmLogs = pgTable('llm_logs', {
	id: text('id').primaryKey(),
	timestamp: timestamp('timestamp').notNull().defaultNow(),
	llmSettingsId: text('llm_settings_id').references(() => llmSettings.id),
	requestPayload: jsonb('request_payload').notNull(),
	responsePayload: jsonb('response_payload').notNull(),
	durationMs: integer('duration_ms').notNull(),
	status: text('status').notNull(), // 'SUCCESS' or 'ERROR'
	relatedJournalId: text('related_journal_id')
});
