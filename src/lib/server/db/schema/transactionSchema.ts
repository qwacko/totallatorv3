import { accountTypeEnum } from '../../../schema/accountTypeSchema';
import { statusEnum } from '../../../schema/statusSchema';
import { relations, sql } from 'drizzle-orm';
import { sqliteTable, text, integer, unique, index } from 'drizzle-orm/sqlite-core';

const timestampColumns = {
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull()
};

const statusColumns = {
	status: text('status', { enum: statusEnum }).notNull().default('active'),
	active: integer('active', { mode: 'boolean' }).notNull().default(true),
	deleted: integer('deleted', { mode: 'boolean' }).notNull().default(true),
	disabled: integer('disabled', { mode: 'boolean' }).notNull().default(true),
	allowUpdate: integer('allow_update', { mode: 'boolean' }).notNull().default(true)
};

const idColumn = {
	id: text('id').primaryKey().notNull()
};

export const account = sqliteTable('account', {
	...idColumn,

	title: text('title').notNull(),
	type: text('type', { enum: accountTypeEnum }).notNull().default('expense'),

	isCash: integer('is_cash', { mode: 'boolean' }).notNull().default(false),
	isNetWorth: integer('is_net_worth', { mode: 'boolean' }).notNull().default(false),
	accountGroup: text('account_group').notNull(),
	accountGroup2: text('account_group_2').notNull(),
	accountGroup3: text('account_group_3').notNull(),
	accountGroupCombined: text('account_group_combined').notNull(),
	accountTitleCombined: text('account_title_combined').notNull().unique(),
	startDate: text('start_date', { length: 10 }),
	endDate: text('end_date', { length: 10 }),
	...statusColumns,
	...timestampColumns
});

export const accountRelations = relations(account, ({ many }) => ({
	journals: many(journalEntry)
}));

export const tag = sqliteTable('tag', {
	...idColumn,
	title: text('title').notNull().unique(),
	group: text('group').notNull(),
	single: text('single').notNull(),
	...statusColumns,
	...timestampColumns
});

export const tagRelations = relations(tag, ({ many }) => ({
	journals: many(journalEntry)
}));

export const category = sqliteTable('category', {
	...idColumn,
	title: text('title').notNull().unique(),
	group: text('group').notNull(),
	single: text('single').notNull(),
	...statusColumns,
	...timestampColumns
});

export const categoryRelations = relations(category, ({ many }) => ({
	journals: many(journalEntry)
}));

export const bill = sqliteTable('bill', {
	...idColumn,
	title: text('title').unique().notNull(),

	...statusColumns,
	...timestampColumns
});

export const billRelations = relations(bill, ({ many }) => ({
	journals: many(journalEntry)
}));

export const budget = sqliteTable('budget', {
	...idColumn,
	title: text('title').unique().notNull(),
	...statusColumns,
	...timestampColumns
});

export const budgetRelations = relations(budget, ({ many }) => ({
	journals: many(journalEntry)
}));

export const label = sqliteTable('label', {
	...idColumn,
	title: text('title').unique().notNull(),
	...statusColumns,
	...timestampColumns
});

export const labelRelations = relations(label, ({ many }) => ({
	journals: many(labelsToJournals)
}));

export const labelsToJournals = sqliteTable(
	'labels_to_journals',
	{
		...idColumn,
		labelId: text('label_id').notNull(),
		journalId: text('journal_id').notNull(),
		...timestampColumns
	},
	(t) => ({
		uniqueRelation: unique().on(t.journalId, t.labelId),
		labelIdx: index('label_idx').on(t.labelId),
		journallabelIdx: index('journal_idx').on(t.journalId)
	})
);

export const labelToJournalsRelations = relations(labelsToJournals, ({ one }) => ({
	journalEntry: one(journalEntry, {
		fields: [labelsToJournals.journalId],
		references: [journalEntry.id]
	}),
	label: one(label, { fields: [labelsToJournals.labelId], references: [label.id] })
}));

const journalSharedColumns = {
	description: text('description').notNull(),

	date: integer('date', { mode: 'timestamp' }).notNull(),
	dateText: text('date_text').notNull(),
	tagId: text('tag_id'),
	billId: text('bill_id'),
	budgetId: text('budget_id'),
	categoryId: text('category_id'),
	accountId: text('account_id'),

	yearMonthDay: text('year_month_day').notNull(),
	yearWeek: text('year_week').notNull(),
	yearMonth: text('year_month').notNull(),
	yearQuarter: text('year_quarter').notNull(),
	year: text('year').notNull(),

	linked: integer('linked', { mode: 'boolean' }).notNull().default(true),
	reconciled: integer('reconciled', { mode: 'boolean' }).notNull().default(false),
	dataChecked: integer('data_checked', { mode: 'boolean' }).notNull().default(false),
	complete: integer('complete', { mode: 'boolean' }).notNull().default(false)
};

export const transaction = sqliteTable('transaction', {
	...idColumn,
	...timestampColumns
});

export const transactionRelations = relations(transaction, ({ many }) => ({
	journals: many(journalEntry)
}));

export const journalEntry = sqliteTable('journal_entry', {
	...idColumn,
	amount: integer('amount', { mode: 'number' }).notNull().default(0),
	transactionId: text('transaction_id').notNull(),
	...journalSharedColumns,
	...timestampColumns
});

export const journalEntryRelations = relations(journalEntry, ({ one, many }) => ({
	transaction: one(transaction, {
		fields: [journalEntry.transactionId],
		references: [transaction.id]
	}),
	account: one(account, {
		fields: [journalEntry.accountId],
		references: [account.id]
	}),
	bill: one(bill, {
		fields: [journalEntry.billId],
		references: [bill.id]
	}),
	budget: one(budget, {
		fields: [journalEntry.budgetId],
		references: [budget.id]
	}),
	category: one(category, {
		fields: [journalEntry.categoryId],
		references: [category.id]
	}),
	tag: one(tag, {
		fields: [journalEntry.tagId],
		references: [tag.id]
	}),
	labels: many(labelsToJournals)
}));
