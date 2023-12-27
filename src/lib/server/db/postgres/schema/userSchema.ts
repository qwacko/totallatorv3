import { currencyFormatEnum, dateFormatEnum } from '../../../../schema/userSchema';
import { pgTable, text, boolean, varchar, bigint } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: varchar('id', { length: 60 }).primaryKey(),
	name: text('name').notNull().default('New User'),
	username: text('username').notNull().unique(),
	admin: boolean('admin').notNull().default(false),
	currencyFormat: text('currencyFormat', { enum: currencyFormatEnum }).notNull().default('USD'),
	dateFormat: text('dateFormat', { enum: dateFormatEnum }).notNull().default('YYYY-MM-DD')
});

export const session = pgTable('user_session', {
	id: varchar('id', { length: 128 }).primaryKey(),
	userId: varchar('user_id', { length: 61 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	activeExpires: bigint('active_expires', {
		mode: 'number'
	}).notNull(),
	idleExpires: bigint('idle_expires', {
		mode: 'number'
	}).notNull()
});

export const key = pgTable('user_key', {
	id: varchar('id', { length: 255 }).primaryKey(),
	userId: varchar('user_id', { length: 62 })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	hashedPassword: varchar('hashed_password', { length: 255 })
});
