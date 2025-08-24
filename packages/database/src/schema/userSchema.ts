import { relations } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { currencyFormatEnum, dateFormatEnum } from '@totallator/shared';

export const user = pgTable('user', {
	id: varchar('id', { length: 60 }).notNull().primaryKey(),
	name: text('name').notNull().default('New User'),
	username: text('username').notNull().unique(),
	admin: boolean('admin').notNull().default(false),
	currencyFormat: text('currencyFormat', { enum: currencyFormatEnum }).notNull().default('USD'),
	dateFormat: text('dateFormat', { enum: dateFormatEnum }).notNull().default('YYYY-MM-DD')
});

export type UserDBType = typeof user.$inferSelect;

export const userRelations = relations(user, ({ one }) => ({
	keys: one(key)
}));

export const session = pgTable('user_session', {
	id: varchar('id', { length: 128 }).primaryKey(),
	userId: varchar('user_id', { length: 61 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull()
});

export type SessionDBType = typeof session.$inferSelect;

export const key = pgTable('user_key', {
	id: varchar('id', { length: 255 }).primaryKey(),
	userId: varchar('user_id', { length: 62 })
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: 'cascade' }),
	hashedPassword: varchar('hashed_password', { length: 255 })
});

export const keyRelations = relations(key, ({ one }) => ({
	user: one(user, {
		fields: [key.userId],
		references: [user.id]
	})
}));
