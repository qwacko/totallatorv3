import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const llmSettings = pgTable('llm_settings', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	apiUrl: text('api_url').notNull(),
	apiKey: text('api_key').notNull(), // Will be encrypted
	defaultModel: text('default_model'),
	enabled: boolean('enabled').notNull().default(true),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export type LLMSettings = typeof llmSettings.$inferSelect;
