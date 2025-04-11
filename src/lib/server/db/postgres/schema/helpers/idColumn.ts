import { text } from 'drizzle-orm/pg-core';

export const idColumn = {
	id: text('id').primaryKey().notNull()
};
