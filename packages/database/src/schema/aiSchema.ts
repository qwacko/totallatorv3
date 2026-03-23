import { relations } from 'drizzle-orm';
import { index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { journalEntry } from './transactionSchema';
import { llmSettings } from './llm';

export const agentRun = pgTable(
	'agent_run',
	{
		id: text('id').primaryKey(),
		taskId: text('task_id').notNull(),
		status: text('status').notNull().default('pending'),
		triggerSource: text('trigger_source'),
		llmSettingsId: text('llm_settings_id').references(() => llmSettings.id),
		provider: text('provider'),
		model: text('model'),
		promptVersion: text('prompt_version'),
		initiatedByUserId: text('initiated_by_user_id'),
		targetJournalCount: integer('target_journal_count').notNull().default(0),
		processedJournalCount: integer('processed_journal_count').notNull().default(0),
		acceptedSuggestionCount: integer('accepted_suggestion_count').notNull().default(0),
		rejectedSuggestionCount: integer('rejected_suggestion_count').notNull().default(0),
		failureCount: integer('failure_count').notNull().default(0),
		summary: text('summary'),
		metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),
		startedAt: timestamp('started_at', { mode: 'date' }),
		completedAt: timestamp('completed_at', { mode: 'date' }),
		createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow()
	},
	(t) => ({
		taskIdIdx: index('agent_run_task_id_idx').on(t.taskId),
		statusIdx: index('agent_run_status_idx').on(t.status),
		llmSettingsIdIdx: index('agent_run_llm_settings_id_idx').on(t.llmSettingsId),
		initiatedByUserIdIdx: index('agent_run_initiated_by_user_id_idx').on(t.initiatedByUserId),
		createdAtIdx: index('agent_run_created_at_idx').on(t.createdAt)
	})
);

export const agentRunEvent = pgTable(
	'agent_run_event',
	{
		id: text('id').primaryKey(),
		agentRunId: text('agent_run_id')
			.notNull()
			.references(() => agentRun.id),
		type: text('type').notNull(),
		journalId: text('journal_id').references(() => journalEntry.id),
		stepIndex: integer('step_index'),
		summary: text('summary'),
		data: jsonb('data').$type<Record<string, unknown> | null>(),
		createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
	},
	(t) => ({
		agentRunIdIdx: index('agent_run_event_agent_run_id_idx').on(t.agentRunId),
		typeIdx: index('agent_run_event_type_idx').on(t.type),
		journalIdIdx: index('agent_run_event_journal_id_idx').on(t.journalId),
		createdAtIdx: index('agent_run_event_created_at_idx').on(t.createdAt)
	})
);

export const agentRunRelations = relations(agentRun, ({ many, one }) => ({
	events: many(agentRunEvent),
	llmSettings: one(llmSettings, {
		fields: [agentRun.llmSettingsId],
		references: [llmSettings.id]
	})
}));

export const agentRunEventRelations = relations(agentRunEvent, ({ one }) => ({
	agentRun: one(agentRun, {
		fields: [agentRunEvent.agentRunId],
		references: [agentRun.id]
	}),
	journal: one(journalEntry, {
		fields: [agentRunEvent.journalId],
		references: [journalEntry.id]
	})
}));

export type AgentRun = typeof agentRun.$inferSelect;
export type AgentRunInsert = typeof agentRun.$inferInsert;
export type AgentRunEvent = typeof agentRunEvent.$inferSelect;
export type AgentRunEventInsert = typeof agentRunEvent.$inferInsert;
