import { accountTypeEnum } from '../../../schema/accountTypeSchema';
import { statusEnum } from '../../../schema/statusSchema';
import { relations, sql } from 'drizzle-orm';
import { sqliteTable, text, integer, unique, index } from 'drizzle-orm/sqlite-core';
import { importSourceEnum, importTypeEnum } from '../../../schema/importSchema';

const timestampColumns = {
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull()
};

const importColumns = (identifier?: string) => ({
	importId: text('import_id'),
	importDetailId: text(
		`${identifier ? identifier : ''}${identifier ? '_' : ''}import_detail_id`
	).unique()
});

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
	...importColumns('account'),

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

export const accountRelations = relations(account, ({ many, one }) => ({
	journals: many(journalEntry),
	importDetail: one(importItemDetail, {
		fields: [account.importDetailId],
		references: [importItemDetail.id]
	}),
	import: one(importTable, {
		fields: [account.importId],
		references: [importTable.id]
	})
}));

export const tag = sqliteTable('tag', {
	...idColumn,
	...importColumns('tag'),
	title: text('title').notNull().unique(),
	group: text('group').notNull(),
	single: text('single').notNull(),
	...statusColumns,
	...timestampColumns
});

export const tagRelations = relations(tag, ({ many, one }) => ({
	journals: many(journalEntry),
	importDetail: one(importItemDetail, {
		fields: [tag.importDetailId],
		references: [importItemDetail.id]
	}),
	import: one(importTable, {
		fields: [tag.importId],
		references: [importTable.id]
	})
}));

export const category = sqliteTable('category', {
	...idColumn,
	...importColumns('category'),
	title: text('title').notNull().unique(),
	group: text('group').notNull(),
	single: text('single').notNull(),
	...statusColumns,
	...timestampColumns
});

export const categoryRelations = relations(category, ({ many, one }) => ({
	journals: many(journalEntry),
	importDetail: one(importItemDetail, {
		fields: [category.importDetailId],
		references: [importItemDetail.id]
	}),
	import: one(importTable, {
		fields: [category.importId],
		references: [importTable.id]
	})
}));

export const bill = sqliteTable('bill', {
	...idColumn,
	...importColumns('bill'),
	title: text('title').unique().notNull(),
	...statusColumns,
	...timestampColumns
});

export const billRelations = relations(bill, ({ many, one }) => ({
	journals: many(journalEntry),
	importDetail: one(importItemDetail, {
		fields: [bill.importDetailId],
		references: [importItemDetail.id]
	}),
	import: one(importTable, {
		fields: [bill.importId],
		references: [importTable.id]
	})
}));

export const budget = sqliteTable('budget', {
	...idColumn,
	...importColumns('budget'),
	title: text('title').unique().notNull(),
	...statusColumns,
	...timestampColumns
});

export const budgetRelations = relations(budget, ({ many, one }) => ({
	journals: many(journalEntry),
	importDetail: one(importItemDetail, {
		fields: [budget.importDetailId],
		references: [importItemDetail.id]
	}),
	import: one(importTable, {
		fields: [budget.importId],
		references: [importTable.id]
	})
}));

export const label = sqliteTable('label', {
	...idColumn,
	...importColumns('label'),
	title: text('title').unique().notNull(),
	...statusColumns,
	...timestampColumns
});

export const labelRelations = relations(label, ({ many, one }) => ({
	journals: many(labelsToJournals),
	importDetail: one(importItemDetail, {
		fields: [label.importDetailId],
		references: [importItemDetail.id]
	}),
	import: one(importTable, {
		fields: [label.importId],
		references: [importTable.id]
	})
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
	accountId: text('account_id').notNull(),

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
	...importColumns(),
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
	importDetail: one(importItemDetail, {
		fields: [journalEntry.importDetailId],
		references: [importItemDetail.id]
	}),
	import: one(importTable, {
		fields: [journalEntry.importId],
		references: [importTable.id]
	}),
	labels: many(labelsToJournals)
}));

export const importItemDetail = sqliteTable(
	'import_item_detail',
	{
		...idColumn,
		importId: text('import_id').notNull(),
		journalId: text('journal_id'),
		journal2Id: text('journal_id'),
		billId: text('bill_id'),
		budgetId: text('budget_id'),
		categoryId: text('category_id'),
		accountId: text('account_id'),
		tagId: text('tag_id'),
		labelId: text('label_id'),
		importInfo: text('import_info', { mode: 'json' }),
		isDuplicate: integer('is_duplicate', { mode: 'boolean' }).notNull().default(false),
		isError: integer('is_error', { mode: 'boolean' }).notNull().default(false),
		isImported: integer('is_imported', { mode: 'boolean' }).notNull().default(false),
		processedInfo: text('processed_info', { mode: 'json' }),
		errorInfo: text('error_info', { mode: 'json' }),
		...timestampColumns
	},
	(t) => ({
		uniqueRelation: unique().on(t.journalId, t.importId),
		importIdx: index('label_import_idx').on(t.importId),
		journalIdx: index('label_journal_idx').on(t.journalId)
	})
);

export const importItemDetailRelations = relations(importItemDetail, ({ one }) => ({
	import: one(importTable, {
		fields: [importItemDetail.importId],
		references: [importTable.id]
	}),
	journal2: one(journalEntry, {
		fields: [importItemDetail.journal2Id],
		references: [journalEntry.id]
	}),
	journal: one(journalEntry, {
		fields: [importItemDetail.journalId],
		references: [journalEntry.id]
	}),
	bill: one(bill, {
		fields: [importItemDetail.billId],
		references: [bill.id]
	}),
	budget: one(budget, {
		fields: [importItemDetail.budgetId],
		references: [budget.id]
	}),
	category: one(category, {
		fields: [importItemDetail.categoryId],
		references: [category.id]
	}),
	account: one(account, {
		fields: [importItemDetail.accountId],
		references: [account.id]
	}),
	tag: one(tag, {
		fields: [importItemDetail.tagId],
		references: [tag.id]
	}),
	label: one(label, {
		fields: [importItemDetail.labelId],
		references: [label.id]
	})
}));

export const importTable = sqliteTable('import', {
	...idColumn,
	...timestampColumns,
	title: text('title').notNull(),
	filename: text('filename').notNull(),
	complete: integer('complete', { mode: 'boolean' }).notNull().default(false),
	source: text('source', { enum: importSourceEnum }).notNull().default('csv'),
	processed: integer('processed', { mode: 'boolean' }).notNull().default(false),
	error: integer('error', { mode: 'boolean' }).notNull().default(false),
	errorInfo: text('error_info', { mode: 'json' }),
	type: text('type', { enum: importTypeEnum }).notNull().default('transaction')
});

export const importTableRelations = relations(importTable, ({ many }) => ({
	importDetails: many(importItemDetail),
	journals: many(journalEntry),
	bills: many(bill),
	budgets: many(budget),
	categories: many(category),
	tags: many(tag),
	labels: many(label)
}));
