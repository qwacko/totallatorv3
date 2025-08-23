import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { logActionEnum, logDestinationEnum, logDomainEnum, logLevelEnum } from '@totallator/shared';

export const logTable = sqliteTable(
	'log',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		date: integer('date', { mode: 'timestamp' }).notNull(),
		logLevel: text('log_level', { enum: logLevelEnum }).notNull(),
		contextId: text('context_id'),
		requestId: text('request_id'),
		userId: text('user_id'),
		routeId: text('route_id'),
		url: text('url'),
		method: text('method'),
		userAgent: text('user_agent'),
		ip: text('ip'),
		action: text('action', { enum: logActionEnum }).notNull(),
		domain: text('domain', { enum: logDomainEnum }).notNull(),
		code: text('code').notNull(),
		title: text('title').notNull(),
		data: text('data', { mode: 'json' }),
		dataString: text('data_string'),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		index('log_date_idx').on(table.date),
		index('log_domain_idx').on(table.domain),
		index('log_level_idx').on(table.logLevel),
		index('log_context_idx').on(table.contextId),
		index('log_request_idx').on(table.requestId),
		index('log_user_idx').on(table.userId),
		index('log_route_idx').on(table.routeId),
		index('log_code_idx').on(table.code)
	]
);

export const configurationTable = sqliteTable(
	'configuration',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		destination: text('destination', { enum: logDestinationEnum }).notNull(),
		domain: text('domain', { enum: logDomainEnum }).notNull(),
		action: text('action', { enum: logActionEnum }).notNull(),
		logLevel: text('log_level', { enum: logLevelEnum }).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		index('config_destination_idx').on(table.destination),
		index('config_domain_action_idx').on(table.domain, table.action),
		index('config_unique_idx').on(table.destination, table.domain, table.action)
	]
);

export type LogInsert = typeof logTable.$inferInsert;
export type LogSelect = typeof logTable.$inferSelect;
export type ConfigurationInsert = typeof configurationTable.$inferInsert;
export type ConfigurationSelect = typeof configurationTable.$inferSelect;
