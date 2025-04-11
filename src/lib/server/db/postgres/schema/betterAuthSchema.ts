import { relations } from 'drizzle-orm';
import { pgTable, text, boolean, varchar, timestamp } from 'drizzle-orm/pg-core';
import { timestampColumns } from './helpers/timestampColumns';
import { currencyFormatEnum, dateFormatEnum } from '../../../../schema/userSchema';

export const user = pgTable('baUser', {
	id: varchar('id', { length: 60 }).notNull().primaryKey(),
	name: text('name').notNull(),
	email: text('email').unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	image: text('image'),
	admin: boolean('admin').notNull().default(false),
	currencyFormat: text('currencyFormat', { enum: currencyFormatEnum }).notNull().default('USD'),
	dateFormat: text('dateFormat', { enum: dateFormatEnum }).notNull().default('YYYY-MM-DD'),
	...timestampColumns
});

export type UserDBType = typeof user.$inferSelect;

export const userRelations = relations(user, ({ many, one }) => ({
	account: many(baAccount),
	sessions: many(baSession)
}));

export const baSession = pgTable('baSession', {
	id: varchar('id', { length: 60 }).notNull().primaryKey(),
	userId: varchar('user_id', { length: 60 }).notNull(),
	token: text('token').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	...timestampColumns
});

export const baSessionRelations = relations(baSession, ({ one }) => ({
	user: one(user, {
		fields: [baSession.userId],
		references: [user.id]
	})
}));

export const baAccount = pgTable('baAccount', {
	id: varchar('id', { length: 60 }).notNull().primaryKey(),
	userId: varchar('user_id', { length: 60 }).notNull(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	idToken: text('id_token'),
	password: text('password'),
	...timestampColumns
});

export const baAccountRelations = relations(baAccount, ({ one }) => ({
	user: one(user, {
		fields: [baAccount.userId],
		references: [user.id]
	})
}));

export const baVerification = pgTable('baVerification', {
	id: varchar('id', { length: 60 }).notNull().primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	...timestampColumns
});
