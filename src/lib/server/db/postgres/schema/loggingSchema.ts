import { relations } from 'drizzle-orm';
import { pgTable, text, varchar, timestamp, integer } from 'drizzle-orm/pg-core';

export const queryLogTitleTable = pgTable('query_log_title', {
	id: varchar('id', { length: 60 }).notNull().primaryKey(),
	title: text('title').notNull()
});

export const queryLogTitleRelationships = relations(queryLogTitleTable, ({ many }) => ({
	queryContents: many(queryContentsTable)
}));

export const queryContentsTable = pgTable('query_contents', {
	id: varchar('id', { length: 60 }).notNull().primaryKey(),
	query: text('query').notNull()
});

export const queryContentsRelationships = relations(queryContentsTable, ({ one }) => ({
	queryLogTitle: one(queryLogTitleTable)
}));

export const queryLogTable = pgTable('query_log', {
	id: varchar('id', { length: 60 }).notNull().primaryKey(),
	title: text('title'),
	titleId: varchar('title_id', { length: 60 }),
	query: text('query').notNull(),
	queryId: varchar('query_id', { length: 60 }),
	time: timestamp('time').notNull(),
	duration: integer('duration').notNull(),
	params: text('params')
});

export const queryLogRelationships = relations(queryLogTable, ({ one }) => ({
	queryLogTitle: one(queryLogTitleTable, {
		fields: [queryLogTable.titleId],
		references: [queryLogTitleTable.id]
	}),
	queryContents: one(queryContentsTable, {
		fields: [queryLogTable.queryId],
		references: [queryContentsTable.id]
	})
}));
