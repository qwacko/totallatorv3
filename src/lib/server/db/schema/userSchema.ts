import { currencyFormatEnum, dateFormatEnum } from '../../../schema/userSchema';
import { sqliteTable, text, blob, integer } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull().default('New User'),
	username: text('username').notNull().unique(),
	admin: integer('admin', { mode: 'boolean' }).notNull().default(false),
	currencyFormat: text('currencyFormat', { enum: currencyFormatEnum }).notNull().default('USD'),
	dateFormat: text('dateFormat', { enum: dateFormatEnum }).notNull().default('YYYY-MM-DD')
});

export const session = sqliteTable('user_session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	activeExpires: blob('active_expires', {
		mode: 'bigint'
	}).notNull(),
	idleExpires: blob('idle_expires', {
		mode: 'bigint'
	}).notNull()
});

export const key = sqliteTable('user_key', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	hashedPassword: text('hashed_password')
});
