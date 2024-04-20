import { pgTable, text, varchar, timestamp, integer } from 'drizzle-orm/pg-core';

export const queryLogTable = pgTable('query_log', {
	id: varchar('id', { length: 60 }).notNull().primaryKey(),
	title: text('title'),
	query: text('query').notNull(),
	time: timestamp('time').notNull(),
	duration: integer('duration').notNull(),
	params: text('params')
});
