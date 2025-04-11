import { pgTable, text } from 'drizzle-orm/pg-core';
import { idColumn } from './helpers/idColumn';
import { timestampColumns } from './helpers/timestampColumns';
import { aiProviderEnum } from '$lib/schema/enum/aiProviderEnum';

export const aiProviderTable = pgTable('ai_provider', {
	...idColumn,
	name: text('name').notNull(),
	provider: text('provider', { enum: aiProviderEnum }).notNull(),
	model: text('model').notNull(),
	apiKey: text('api_key').notNull(),
	...timestampColumns
});
