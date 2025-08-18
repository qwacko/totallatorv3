import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

export const logDomainEnum = [
			'accounts', 'auth', 'auto-import', 'backup', 'bills', 'budgets', 
			'categories', 'cron', 'database', 'export', 'files', 'import', 
			'journals', 'labels', 'llm', 'materialized-views', 'notes', 
			'queries', 'reports', 'tags', 'users', 'server', ''
		] as const
export const logActionEnum =  ['Read', 'Update', 'Create', 'Delete', 'Other', ""] as const
export const logLevelEnum = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'] as const
export const logDestinationEnum = ['console', 'database'] as const

export const logTable = sqliteTable('log', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	date: integer('date', { mode: 'timestamp' }).notNull(),
	logLevel: text('log_level', { enum: logLevelEnum }).notNull(),
	contextId: text('context_id'),
	action: text('action', { enum: logActionEnum }).notNull(),
	domain: text('domain', { enum: logDomainEnum}).notNull(),
	code: text('code').notNull(),
	title: text('title').notNull(),
	data: text('data', { mode: 'json' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => [index('log_date_idx').on(table.date),
	index('log_domain_idx').on(table.domain),
	index('log_level_idx').on(table.logLevel),
	index('log_context_idx').on(table.contextId),
	index('log_code_idx').on(table.code)]
);

export const configurationTable = sqliteTable('configuration', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	destination: text('destination', { enum: logDestinationEnum }).notNull(),
	domain: text('domain', { enum: logDomainEnum }).notNull(),
	action: text('action', { enum: logActionEnum }).notNull(),
	logLevel: text('log_level', { enum: logLevelEnum }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => [
	index('config_destination_idx').on(table.destination),
	index('config_domain_action_idx').on(table.domain, table.action),
	index('config_unique_idx').on(table.destination, table.domain, table.action)
]);

export type LogInsert = typeof logTable.$inferInsert;
export type LogSelect = typeof logTable.$inferSelect;
export type ConfigurationInsert = typeof configurationTable.$inferInsert;
export type ConfigurationSelect = typeof configurationTable.$inferSelect;