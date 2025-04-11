import { timestamp } from 'drizzle-orm/pg-core';

export const timestampColumns = {
	createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { precision: 6, withTimezone: true, mode: 'date' }).notNull()
};
