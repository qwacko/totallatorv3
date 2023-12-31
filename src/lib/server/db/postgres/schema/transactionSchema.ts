import { accountTypeEnum } from '../../../../schema/accountTypeSchema';
import { statusEnum } from '../../../../schema/statusSchema';
import { relations } from 'drizzle-orm';
import {
	pgTable,
	text,
	integer,
	unique,
	index,
	boolean,
	timestamp,
	json,
	varchar,
	customType
} from 'drizzle-orm/pg-core';
import {
	importDetailStatusEnum,
	importSourceEnum,
	importStatusEnum,
	importTypeEnum
} from '../../../../schema/importSchema';
import { reusableFilterModifcationType } from '../../../../schema/reusableFilterSchema';

const moneyType = customType<{ data: number }>({
	dataType() {
		return 'numeric(20, 4)';
	},
	fromDriver(value) {
		return Number(value);
	},
	toDriver(value) {
		return value.toFixed(4);
	}
});

const timestampColumns = {
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { precision: 6, withTimezone: true }).notNull()
};

const importColumns = (identifier?: string) => ({
	importId: text('import_id'),
	importDetailId: text(`${identifier ? identifier : ''}${identifier ? '_' : ''}import_detail_id`)
});

const statusColumns = {
	status: text('status', { enum: statusEnum }).notNull().default('active'),
	active: boolean('active').notNull().default(true),
	disabled: boolean('disabled').notNull().default(true),
	allowUpdate: boolean('allow_update').notNull().default(true)
};

const idColumn = {
	id: text('id').primaryKey().notNull()
};

export const account = pgTable(
	'account',
	{
		...idColumn,
		...importColumns('account'),

		title: text('title').notNull(),
		type: text('type', { enum: accountTypeEnum }).notNull().default('expense'),

		isCash: boolean('is_cash').notNull().default(false),
		isNetWorth: boolean('is_net_worth').notNull().default(false),
		accountGroup: text('account_group').notNull(),
		accountGroup2: text('account_group_2').notNull(),
		accountGroup3: text('account_group_3').notNull(),
		accountGroupCombined: text('account_group_combined').notNull(),
		accountTitleCombined: text('account_title_combined').notNull().unique(),
		startDate: varchar('start_date', { length: 10 }),
		endDate: varchar('end_date', { length: 10 }),
		summaryId: text('summary_id'),
		...statusColumns,
		...timestampColumns
	},
	(t) => ({
		title: index('account_title_idx').on(t.title),
		type: index('account_type_idx').on(t.type),
		isCash: index('account_is_cash_idx').on(t.isCash),
		isNetWorth: index('account_is_net_worth_idx').on(t.isNetWorth),
		accountGroupCombined: index('account_account_group_combined_idx').on(t.accountGroupCombined),
		accountGroupTitleCombined: index('account_account_title_combined_idx').on(
			t.accountTitleCombined
		)
	})
);

export const accountRelations = relations(account, ({ many, one }) => ({
	journals: many(journalEntry),
	importDetail: one(importItemDetail, {
		fields: [account.importDetailId],
		references: [importItemDetail.id]
	}),
	import: one(importTable, {
		fields: [account.importId],
		references: [importTable.id]
	}),
	summary: one(summaryTable, {
		fields: [account.summaryId],
		references: [summaryTable.id]
	})
}));

export const tag = pgTable(
	'tag',
	{
		...idColumn,
		...importColumns('tag'),
		title: text('title').notNull().unique(),
		group: text('group').notNull(),
		single: text('single').notNull(),
		summaryId: text('summary_id'),
		...statusColumns,
		...timestampColumns
	},
	(t) => ({
		title: index('tag_title_idx').on(t.title),
		group: index('tag_group_idx').on(t.group),
		single: index('tag_single_idx').on(t.single),
		summaryId: index('tag_summary_id_idx').on(t.summaryId)
	})
);

export const tagRelations = relations(tag, ({ many, one }) => ({
	journals: many(journalEntry),
	importDetail: one(importItemDetail, {
		fields: [tag.importDetailId],
		references: [importItemDetail.id]
	}),
	import: one(importTable, {
		fields: [tag.importId],
		references: [importTable.id]
	}),
	summary: one(summaryTable, {
		fields: [tag.summaryId],
		references: [summaryTable.id]
	})
}));

export const category = pgTable(
	'category',
	{
		...idColumn,
		...importColumns('category'),
		title: text('title').notNull().unique(),
		group: text('group').notNull(),
		single: text('single').notNull(),
		summaryId: text('summary_id'),
		...statusColumns,
		...timestampColumns
	},
	(t) => ({
		title: index('category_title_idx').on(t.title),
		group: index('category_group_idx').on(t.group),
		single: index('category_single_idx').on(t.single),
		summaryId: index('category_summary_id_idx').on(t.summaryId)
	})
);

export const categoryRelations = relations(category, ({ many, one }) => ({
	journals: many(journalEntry),
	importDetail: one(importItemDetail, {
		fields: [category.importDetailId],
		references: [importItemDetail.id]
	}),
	import: one(importTable, {
		fields: [category.importId],
		references: [importTable.id]
	}),
	summary: one(summaryTable, {
		fields: [category.summaryId],
		references: [summaryTable.id]
	})
}));

export const bill = pgTable(
	'bill',
	{
		...idColumn,
		...importColumns('bill'),
		title: text('title').unique().notNull(),
		summaryId: text('summary_id'),
		...statusColumns,
		...timestampColumns
	},
	(t) => ({
		title: index('bill_title_idx').on(t.title),
		summaryId: index('bill_summary_id_idx').on(t.summaryId)
	})
);

export const billRelations = relations(bill, ({ many, one }) => ({
	journals: many(journalEntry),
	importDetail: one(importItemDetail, {
		fields: [bill.importDetailId],
		references: [importItemDetail.id]
	}),
	import: one(importTable, {
		fields: [bill.importId],
		references: [importTable.id]
	}),
	summary: one(summaryTable, {
		fields: [bill.summaryId],
		references: [summaryTable.id]
	})
}));

export const budget = pgTable(
	'budget',
	{
		...idColumn,
		...importColumns('budget'),
		title: text('title').unique().notNull(),
		summaryId: text('summary_id'),
		...statusColumns,
		...timestampColumns
	},
	(t) => ({
		title: index('budget_title_idx').on(t.title),
		summaryId: index('budget_summary_id_idx').on(t.summaryId)
	})
);

export const budgetRelations = relations(budget, ({ many, one }) => ({
	journals: many(journalEntry),
	importDetail: one(importItemDetail, {
		fields: [budget.importDetailId],
		references: [importItemDetail.id]
	}),
	import: one(importTable, {
		fields: [budget.importId],
		references: [importTable.id]
	}),
	summary: one(summaryTable, {
		fields: [budget.summaryId],
		references: [summaryTable.id]
	})
}));

export const label = pgTable('label', {
	...idColumn,
	...importColumns('label'),
	title: text('title').unique().notNull(),
	summaryId: text('summary_id'),
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
	}),
	summary: one(summaryTable, {
		fields: [label.summaryId],
		references: [summaryTable.id]
	})
}));

export const labelsToJournals = pgTable(
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

	date: timestamp('date').notNull(),
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

	linked: boolean('linked').notNull().default(true),
	reconciled: boolean('reconciled').notNull().default(false),
	dataChecked: boolean('data_checked').notNull().default(false),
	complete: boolean('complete').notNull().default(false),

	transfer: boolean('transfer').notNull().default(true)
};

export const transaction = pgTable('transaction', {
	...idColumn,
	...timestampColumns
});

export const transactionRelations = relations(transaction, ({ many }) => ({
	journals: many(journalEntry)
}));

export const journalEntry = pgTable(
	'journal_entry',
	{
		...idColumn,
		...importColumns(),
		uniqueId: text('unique_id'),
		amount: moneyType('amount').notNull().default(0),
		transactionId: text('transaction_id').notNull(),
		...journalSharedColumns,
		...timestampColumns
	},
	(t) => ({
		createdAt: index('journalEntry_created_at_idx').on(t.createdAt),
		transactionId: index('journalEntry_transaction_id_idx').on(t.transactionId),
		dateAmount: index('journalEntry_date_amount_idx').on(t.date, t.amount),
		date: index('journalEntry_date_idx').on(t.date),
		dateText: index('journalEntry_date_text_idx').on(t.dateText),
		description: index('journalEntry_description_idx').on(t.description),
		transfer: index('journalEntry_transfer_idx').on(t.transfer),
		complete: index('journalEntry_complete_idx').on(t.complete),
		reconciled: index('journalEntry_reconciled_idx').on(t.reconciled),
		dataChecked: index('journalEntry_data_checked_idx').on(t.dataChecked),
		accountId: index('journalEntry_account_id_idx').on(t.accountId),
		billId: index('journalEntry_bill_id_idx').on(t.billId),
		budgetId: index('journalEntry_budget_id_idx').on(t.budgetId),
		categoryId: index('journalEntry_category_id_idx').on(t.categoryId),
		tagId: index('journalEntry_tag_id_idx').on(t.tagId),
		importId: index('journalEntry_import_id_idx').on(t.importId),
		importDetailId: index('journalEntry_import_detail_id_idx').on(t.importDetailId),
		yearMonth: index('journalEntry_year_month_idx').on(t.yearMonth)
	})
);

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

export const importItemDetail = pgTable(
	'import_item_detail',
	{
		...idColumn,
		importId: text('import_id').notNull(),
		status: text('status', { enum: importDetailStatusEnum }).notNull().default('error'),
		duplicateId: text('duplicate_id'),
		uniqueId: text('unique_id'),
		relationId: text('relation_id'),
		relation2Id: text('relation_2_id'),
		importInfo: json('import_info'),
		processedInfo: json('processed_info').$type<
			| {
					dataToUse?: Record<string, unknown>;
					source?: Record<string, unknown>;
					processed?: Record<string, unknown>;
			  }
			| undefined
		>(),
		errorInfo: json('error_info').$type<
			| {
					error?: Record<string, unknown>;
					errors?: string[];
			  }
			| undefined
		>(),
		...timestampColumns
	},
	(t) => ({
		importIdx: index('importDetail_import_idx').on(t.importId),
		duplicateIdx: index('importDetail_duplicate_idx').on(t.duplicateId),
		relationIdx: index('importDetail_relation_idx').on(t.relationId),
		relation2Idx: index('importDetail_relation_2_idx').on(t.relation2Id),
		statusIdx: index('importDetail_status_idx').on(t.status)
	})
);

export const importItemDetailRelations = relations(importItemDetail, ({ one }) => ({
	import: one(importTable, {
		fields: [importItemDetail.importId],
		references: [importTable.id]
	}),
	journal2: one(journalEntry, {
		fields: [importItemDetail.relation2Id],
		references: [journalEntry.id]
	}),
	journal: one(journalEntry, {
		fields: [importItemDetail.relationId],
		references: [journalEntry.id]
	}),
	bill: one(bill, {
		fields: [importItemDetail.relationId],
		references: [bill.id]
	}),
	budget: one(budget, {
		fields: [importItemDetail.relationId],
		references: [budget.id]
	}),
	category: one(category, {
		fields: [importItemDetail.relationId],
		references: [category.id]
	}),
	account: one(account, {
		fields: [importItemDetail.relationId],
		references: [account.id]
	}),
	tag: one(tag, {
		fields: [importItemDetail.relationId],
		references: [tag.id]
	}),
	label: one(label, {
		fields: [importItemDetail.relationId],
		references: [label.id]
	})
}));

export const importTable = pgTable(
	'import',
	{
		...idColumn,
		...timestampColumns,
		title: text('title').notNull(),
		filename: text('filename'),
		checkImportedOnly: boolean('check_imported_only').notNull().default(false),
		status: text('status', { enum: importStatusEnum }).notNull().default('error'),
		source: text('source', { enum: importSourceEnum }).notNull().default('csv'),
		type: text('type', { enum: importTypeEnum }).notNull().default('transaction'),
		importMappingId: text('mapped_import_id'),
		errorInfo: json('error_info')
	},
	(t) => ({
		statusIdx: index('label_status_idx').on(t.status),
		sourceIdx: index('label_source_idx').on(t.source),
		typeIdx: index('label_type_idx').on(t.type),
		mappedImportIdx: index('label_mapped_import_idx').on(t.importMappingId)
	})
);

export const importTableRelations = relations(importTable, ({ many, one }) => ({
	importDetails: many(importItemDetail),
	journals: many(journalEntry),
	bills: many(bill),
	budgets: many(budget),
	categories: many(category),
	tags: many(tag),
	labels: many(label),
	importMapping: one(importMapping, {
		fields: [importTable.importMappingId],
		references: [importMapping.id]
	})
}));

export const summaryTable = pgTable(
	'summary',
	{
		...idColumn,
		...timestampColumns,
		type: text('type', {
			enum: ['account', 'bill', 'budget', 'category', 'tag', 'label']
		}).notNull(),
		needsUpdate: boolean('needs_update').notNull().default(true),
		relationId: text('relation_id').notNull(),
		sum: moneyType('sum').default(0),
		count: moneyType('count').default(0),
		firstDate: timestamp('first_date'),
		lastDate: timestamp('last_date')
	},
	(t) => ({
		typeIdx: index('summary_type_idx').on(t.type),
		relationIdx: index('summary_relation_idx').on(t.relationId),
		needsUpdateIdx: index('summary_needs_update_idx').on(t.needsUpdate)
	})
);

export const summaryTableRelations = relations(summaryTable, ({ one }) => ({
	account: one(account, {
		fields: [summaryTable.relationId],
		references: [account.id]
	}),
	bill: one(bill, {
		fields: [summaryTable.relationId],
		references: [bill.id]
	}),
	budget: one(budget, {
		fields: [summaryTable.relationId],
		references: [budget.id]
	}),
	category: one(category, {
		fields: [summaryTable.relationId],
		references: [category.id]
	}),
	tag: one(tag, {
		fields: [summaryTable.relationId],
		references: [tag.id]
	}),
	label: one(label, {
		fields: [summaryTable.relationId],
		references: [label.id]
	})
}));

export const reusableFilter = pgTable(
	'filter',
	{
		...idColumn,
		...timestampColumns,
		title: text('title').notNull(),
		group: text('group'),
		journalCount: integer('journal_count').notNull().default(0),
		canApply: boolean('can_apply').notNull().default(false),
		needsUpdate: boolean('needs_update').notNull().default(true),
		applyAutomatically: boolean('apply_automatically').notNull().default(false),
		applyFollowingImport: boolean('apply_following_import').notNull().default(false),
		listed: boolean('listed').notNull().default(true),
		modificationType: text('modification_type', { enum: reusableFilterModifcationType }).default(
			'replace'
		),
		filter: text('filter').notNull(),
		filterText: text('filter_text').notNull(),
		change: text('change'),
		changeText: text('change_text')
	},
	(t) => ({
		titleIdx: index('filter_title_idx').on(t.title),
		groupIdx: index('filter_group_idx').on(t.group),
		canApplyIdx: index('filter_can_apply_idx').on(t.canApply),
		needsUpdateIdx: index('filter_needs_update_idx').on(t.needsUpdate),
		applyAutomaticallyIdx: index('filter_apply_automatically_idx').on(t.applyAutomatically),
		applyFollowingImportIdx: index('filter_apply_following_import_idx').on(t.applyFollowingImport),
		listedIdx: index('filter_listed_idx').on(t.listed),
		modificationTypeIdx: index('filter_modification_type_idx').on(t.modificationType)
	})
);

export const importMapping = pgTable('import_mapping', {
	...idColumn,
	...timestampColumns,
	title: text('title').notNull(),
	configuration: text('configuration').notNull(),
	sampleData: text('sample_data')
});

export type ImportMappingType = typeof importMapping.$inferSelect;

export const importMappingRelations = relations(importMapping, ({ many }) => ({
	imports: many(importTable)
}));
