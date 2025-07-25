import { pgTable, text, timestamp, real } from 'drizzle-orm/pg-core';
import { llmSettings } from './llm';
import { journalEntry } from './transactionSchema';

export const journalLlmSuggestions = pgTable('journal_llm_suggestions', {
	id: text('id').primaryKey(),
	journalId: text('journal_id').references(() => journalEntry.id).notNull(),
	llmSettingsId: text('llm_settings_id').references(() => llmSettings.id).notNull(),
	
	// Suggested field values
	suggestedPayee: text('suggested_payee'),
	suggestedDescription: text('suggested_description'),
	suggestedCategoryId: text('suggested_category_id'),
	suggestedTagId: text('suggested_tag_id'),
	suggestedBillId: text('suggested_bill_id'),
	suggestedBudgetId: text('suggested_budget_id'),
	suggestedAccountId: text('suggested_account_id'),
	
	// Metadata
	confidenceScore: real('confidence_score'), // 0.0 to 1.0
	reasoning: text('reasoning'), // LLM's explanation for the suggestion
	status: text('status').notNull().default('pending'), // 'pending', 'accepted', 'rejected', 'superseded'
	
	// Audit trail
	createdAt: timestamp('created_at').notNull().defaultNow(),
	processedAt: timestamp('processed_at'),
	processedBy: text('processed_by'), // user ID who accepted/rejected
	
	// Link to LLM interaction log
	llmLogId: text('llm_log_id'), // Optional reference to the LLM call that generated this
	
	// Versioning - allows multiple suggestions per journal
	version: text('version').notNull().default('1') // Incremented if new suggestions replace old ones
});

export type JournalLlmSuggestion = typeof journalLlmSuggestions.$inferSelect;
export type JournalLlmSuggestionInsert = typeof journalLlmSuggestions.$inferInsert;