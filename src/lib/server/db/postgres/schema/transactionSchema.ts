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
	customType,
	jsonb,
	pgEnum
} from 'drizzle-orm/pg-core';
import {
	importDetailStatusEnum,
	importSourceEnum,
	importStatusEnum,
	importTypeEnum
} from '../../../../schema/importSchema';
import { reusableFilterModifcationType } from '../../../../schema/reusableFilterSchema';
import type { JournalFilterSchemaWithoutPaginationType } from '../../../../schema/journalSchema';
import {
	autoImportFrequencyEnum,
	type AutoImportCombinedSchemaType,
	autoImportTypes
} from '../../../../schema/autoImportSchema';
import { pageSizeEnum } from '../../../../schema/pageSizeSchema';
import { type ReportElementLayoutType } from '../../../../schema/reportHelpers/reportElementLayoutEnum';
import type { ReportConfigPartSchemaType } from '../../../../schema/reportHelpers/reportConfigPartSchema';
import type { CombinedBackupSchemaInfoType } from '$lib/server/backups/backupSchema';

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
	createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { precision: 6, withTimezone: true, mode: 'date' }).notNull()
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
	files: many(fileTable),
	notes: many(notesTable)
}));

export const tag = pgTable(
	'tag',
	{
		...idColumn,
		...importColumns('tag'),
		title: text('title').notNull().unique(),
		group: text('group').notNull(),
		single: text('single').notNull(),
		...statusColumns,
		...timestampColumns
	},
	(t) => ({
		title: index('tag_title_idx').on(t.title),
		group: index('tag_group_idx').on(t.group),
		single: index('tag_single_idx').on(t.single)
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
	files: many(fileTable),
	notes: many(notesTable)
}));

export const category = pgTable(
	'category',
	{
		...idColumn,
		...importColumns('category'),
		title: text('title').notNull().unique(),
		group: text('group').notNull(),
		single: text('single').notNull(),
		...statusColumns,
		...timestampColumns
	},
	(t) => ({
		title: index('category_title_idx').on(t.title),
		group: index('category_group_idx').on(t.group),
		single: index('category_single_idx').on(t.single)
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
	files: many(fileTable),
	notes: many(notesTable)
}));

export const bill = pgTable(
	'bill',
	{
		...idColumn,
		...importColumns('bill'),
		title: text('title').unique().notNull(),
		...statusColumns,
		...timestampColumns
	},
	(t) => ({
		title: index('bill_title_idx').on(t.title)
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
	files: many(fileTable),
	notes: many(notesTable)
}));

export const budget = pgTable(
	'budget',
	{
		...idColumn,
		...importColumns('budget'),
		title: text('title').unique().notNull(),
		...statusColumns,
		...timestampColumns
	},
	(t) => ({
		title: index('budget_title_idx').on(t.title)
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
	files: many(fileTable),
	notes: many(notesTable)
}));

export const label = pgTable('label', {
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
	}),
	files: many(fileTable),
	notes: many(notesTable)
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
	journals: many(journalEntry),
	files: many(fileTable),
	notes: many(notesTable)
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

const fileReasonEnum = ['receipt', 'invoice', 'report', 'info'] as const;
export type FileReason = (typeof fileReasonEnum)[number];

export const fileTable = pgTable(
	'files',
	{
		...idColumn,
		...timestampColumns,
		title: text('title'),
		reason: text('reason', { enum: fileReasonEnum }).notNull(),
		originalFilename: text('original_filename').notNull(),
		filename: text('filename').notNull(),
		type: text('type').notNull(),
		size: integer('size').notNull(),
		fileExists: boolean('file_exists').notNull(),
		linked: boolean('linked').notNull(),
		transactionId: text('transaction_id'),
		accountId: text('account_id'),
		billId: text('bill_id'),
		budgetId: text('budget_id'),
		categoryId: text('category_id'),
		tagId: text('tag_id'),
		labelId: text('label_id'),
		autoImportId: text('auto_import_id'),
		reportId: text('report_id'),
		reportElementId: text('report_element_id')
	},
	(t) => ({
		reasonIdx: index('file_reason_idx').on(t.reason),
		titleIdx: index('file_title_idx').on(t.title),
		filenameIdx: index('file_filename_idx').on(t.filename),
		typeIdx: index('file_type_idx').on(t.type),
		sizeIdx: index('file_size_idx').on(t.size),
		fileExistsIdx: index('file_file_exists_idx').on(t.fileExists),
		transactionIdx: index('file_transaction_idx').on(t.transactionId),
		accountIdx: index('file_account_idx').on(t.accountId),
		billIdx: index('file_bill_idx').on(t.billId),
		budgetIdx: index('file_budget_idx').on(t.budgetId),
		categoryIdx: index('file_category_idx').on(t.categoryId),
		tagIdx: index('file_tag_idx').on(t.tagId),
		labelIdx: index('file_label_idx').on(t.labelId),
		autoImportIdx: index('file_auto_import_idx').on(t.autoImportId),
		reportIdx: index('file_report_idx').on(t.reportId),
		reportElementIdx: index('file_report_element_idx').on(t.reportElementId)
	})
);

export const fileTableRelations = relations(fileTable, ({ one, many }) => ({
	transaction: one(transaction, {
		fields: [fileTable.transactionId],
		references: [transaction.id]
	}),
	account: one(account, {
		fields: [fileTable.accountId],
		references: [account.id]
	}),
	bill: one(bill, {
		fields: [fileTable.billId],
		references: [bill.id]
	}),
	budget: one(budget, {
		fields: [fileTable.budgetId],
		references: [budget.id]
	}),
	category: one(category, {
		fields: [fileTable.categoryId],
		references: [category.id]
	}),
	tag: one(tag, {
		fields: [fileTable.tagId],
		references: [tag.id]
	}),
	label: one(label, {
		fields: [fileTable.labelId],
		references: [label.id]
	}),
	autoImport: one(autoImportTable, {
		fields: [fileTable.autoImportId],
		references: [autoImportTable.id]
	}),
	report: one(report, {
		fields: [fileTable.reportId],
		references: [report.id]
	}),
	reportElement: one(reportElement, {
		fields: [fileTable.reportElementId],
		references: [reportElement.id]
	}),
	notes: many(notesTable)
}));

export const noteTypeEnum = ['info', 'reminder'] as const;
export type NoteTypeType = (typeof noteTypeEnum)[number];

export const notesTable = pgTable(
	'notes',
	{
		...idColumn,
		...timestampColumns,
		note: text('note').notNull(),
		type: text('type', { enum: noteTypeEnum }).notNull().default('info'),
		createdById: text('created_by').notNull(),
		transactionId: text('transaction_id'),
		accountId: text('account_id'),
		billId: text('bill_id'),
		budgetId: text('budget_id'),
		categoryId: text('category_id'),
		tagId: text('tag_id'),
		labelId: text('label_id'),
		fileId: text('file_id'),
		autoImportId: text('auto_import_id'),
		reportId: text('report_id'),
		reportElementId: text('report_element_id')
	},
	(t) => ({
		noteIdx: index('note_note_idx').on(t.note),
		typeIdx: index('note_type_idx').on(t.type),
		transactionIdx: index('note_transaction_idx').on(t.transactionId),
		accountIdx: index('note_account_idx').on(t.accountId),
		billIdx: index('note_bill_idx').on(t.billId),
		budgetIdx: index('note_budget_idx').on(t.budgetId),
		categoryIdx: index('note_category_idx').on(t.categoryId),
		tagIdx: index('note_tag_idx').on(t.tagId),
		labelIdx: index('note_label_idx').on(t.labelId),
		createdByIdx: index('note_created_by_idx').on(t.createdById),
		fileIdx: index('note_file_idx').on(t.fileId),
		autoImportIdx: index('note_auto_import_idx').on(t.autoImportId),
		reportIdx: index('note_report_idx').on(t.reportId),
		reportElementIdx: index('note_report_element_idx').on(t.reportElementId)
	})
);

export const notesTableRelations = relations(notesTable, ({ one }) => ({
	transaction: one(transaction, {
		fields: [notesTable.transactionId],
		references: [transaction.id]
	}),
	account: one(account, {
		fields: [notesTable.accountId],
		references: [account.id]
	}),
	bill: one(bill, {
		fields: [notesTable.billId],
		references: [bill.id]
	}),
	budget: one(budget, {
		fields: [notesTable.budgetId],
		references: [budget.id]
	}),
	category: one(category, {
		fields: [notesTable.categoryId],
		references: [category.id]
	}),
	tag: one(tag, {
		fields: [notesTable.tagId],
		references: [tag.id]
	}),
	label: one(label, {
		fields: [notesTable.labelId],
		references: [label.id]
	}),
	file: one(fileTable, {
		fields: [notesTable.fileId],
		references: [fileTable.id]
	}),
	autoImport: one(autoImportTable, {
		fields: [notesTable.autoImportId],
		references: [autoImportTable.id]
	}),
	report: one(report, {
		fields: [notesTable.reportId],
		references: [report.id]
	}),
	reportElement: one(reportElement, {
		fields: [notesTable.reportElementId],
		references: [reportElement.id]
	})
}));

export const importItemDetail = pgTable(
	'import_item_detail',
	{
		...idColumn,
		importId: text('import_id').notNull(),
		status: text('status', { enum: importDetailStatusEnum }).notNull().default('error'),
		statusText: text('status_text'),
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

export type ImportProgress =
	| {
			startTime: Date;
			count: number;
			ids: string[];
			complete: number;
			completeIds: string[];
	  }
	| null
	| undefined;

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
		autoProcess: boolean('auto_process').notNull().default(false),
		autoClean: boolean('auto_clean').notNull().default(false),
		importMappingId: text('mapped_import_id'),
		autoImportId: text('auto_import_id'),
		errorInfo: json('error_info'),
		importStatus: jsonb('import_status').$type<ImportProgress>().default(null)
	},
	(t) => ({
		statusIdx: index('label_status_idx').on(t.status),
		sourceIdx: index('label_source_idx').on(t.source),
		typeIdx: index('label_type_idx').on(t.type),
		mappedImportIdx: index('label_mapped_import_idx').on(t.importMappingId),
		autoImportIdx: index('import_auto_import_idx').on(t.autoImportId)
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
	}),
	autoImport: one(autoImportTable, {
		fields: [importTable.autoImportId],
		references: [autoImportTable.id]
	})
}));

export const autoImportTable = pgTable(
	'auto_import',
	{
		...idColumn,
		...timestampColumns,
		title: text('title').notNull(),
		enabled: boolean('enabled').notNull().default(false),
		importMappingId: text('mapped_import_id').notNull(),
		frequency: text('frequency', { enum: autoImportFrequencyEnum }).notNull(),
		type: text('type', { enum: autoImportTypes }).notNull(),
		lastTransactionDate: timestamp('last_transaction_date'),
		autoProcess: boolean('auto_process').notNull().default(true),
		autoClean: boolean('auto_clean').notNull().default(true),
		config: jsonb('config').$type<AutoImportCombinedSchemaType>().notNull()
	},
	(t) => ({
		mappedImportIdx: index('auto_import_mapped_import_idx').on(t.importMappingId),
		frequencyIdx: index('auto_import_frequency_idx').on(t.frequency),
		titleIdx: index('auto_import_title_idx').on(t.title),
		typeIdx: index('auto_import_type_idx').on(t.type)
	})
);

export const autoImportTableRelations = relations(autoImportTable, ({ one, many }) => ({
	importMapping: one(importMapping, {
		fields: [autoImportTable.importMappingId],
		references: [importMapping.id]
	}),
	imports: many(importTable),
	files: many(fileTable),
	notes: many(notesTable)
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

export const filter = pgTable(
	'single_filter',
	{
		...idColumn,
		...timestampColumns,
		filter: jsonb('filter').notNull().$type<JournalFilterSchemaWithoutPaginationType>(),
		filterText: text('filter_text').notNull()
	},
	(t) => ({
		filterTextIdx: index('filter_filter_text_idx').on(t.filterText)
	})
);

export const reportElementConfig = pgTable(
	'report_element_config',
	{
		...idColumn,
		...timestampColumns,
		title: text('title'),
		group: text('group'),
		locked: boolean('locked').notNull().default(false),
		reusable: boolean('reusable').notNull().default(false),
		layout: text('layout').$type<ReportElementLayoutType>().notNull().default('singleItem'),
		config: jsonb('config').$type<ReportConfigPartSchemaType>()
	},
	(t) => ({
		titleIdx: index('report_element_config_title_idx').on(t.title),
		groupIdx: index('report_element_config_group_idx').on(t.group),
		reusableIdx: index('report_element_config_reusable_idx').on(t.reusable),
		titleGroupIdx: index('report_element_config_title_group_idx').on(t.title, t.group),
		lockedIdx: index('report_element_config_locked_idx').on(t.locked)
	})
);

export type InsertReportElementConfigType = typeof reportElementConfig.$inferInsert;

export const filtersToReportConfigs = pgTable(
	'filters_to_report_configs',
	{
		...idColumn,
		...timestampColumns,
		reportElementConfigId: text('report_element_config_id').notNull(),
		filterId: text('filter_id').notNull(),
		order: integer('order').notNull().default(0)
	},
	(t) => ({
		uniqueRelation: unique().on(t.reportElementConfigId, t.filterId),
		uniqueOrder: unique().on(t.reportElementConfigId, t.order),
		reportElementConfigIdx: index('report_element_config__from_filter_idx').on(
			t.reportElementConfigId
		),
		filterIdx: index('filter_idx').on(t.filterId)
	})
);

export const reportSizeEnum = pgEnum('report_size', pageSizeEnum);

export const report = pgTable(
	'report',
	{
		...idColumn,
		...timestampColumns,
		title: text('title').notNull(),
		group: text('group'),
		size: reportSizeEnum('size').notNull().default('xl'),
		locked: boolean('locked').notNull().default(false),
		filterId: text('filter_id')
	},
	(t) => ({
		titleIdx: index('report_title_idx').on(t.title),
		groupIdx: index('report_group_idx').on(t.group),
		titleGroupIdx: index('report_title_group_idx').on(t.title, t.group),
		lockedIdx: index('report_locked_idx').on(t.locked),
		filterIdx: index('report_filter_idx').on(t.filterId)
	})
);

export const reportElement = pgTable(
	'report_element',
	{
		...idColumn,
		...timestampColumns,
		title: text('title'),
		reportId: text('report_id').notNull(),

		//Position Information
		rows: integer('rows').notNull().default(0),
		cols: integer('cols').notNull().default(0),
		order: integer('order').notNull().default(0),

		//View Configuration
		reportElementConfigId: text('report_element_config_id').notNull(),
		filterId: text('filter_id')
	},
	(t) => ({
		reportElementConfigIdx: index('report_element_config_idx').on(t.reportElementConfigId),
		reportIdx: index('report_idx').on(t.reportId),
		filterIdx: index('report_element_filter_idx').on(t.filterId)
	})
);

export const reportElementRelations = relations(reportElement, ({ one, many }) => ({
	reportElementConfig: one(reportElementConfig, {
		fields: [reportElement.reportElementConfigId],
		references: [reportElementConfig.id]
	}),
	report: one(report, {
		fields: [reportElement.reportId],
		references: [report.id]
	}),
	filter: one(filter, {
		fields: [reportElement.filterId],
		references: [filter.id]
	})
}));

export const reportElementConfigRelations = relations(reportElementConfig, ({ many, one }) => ({
	reportElements: many(reportElement),
	filters: many(filtersToReportConfigs)
}));

export const reportRelations = relations(report, ({ many, one }) => ({
	reportElements: many(reportElement),
	filter: one(filter, {
		fields: [report.filterId],
		references: [filter.id]
	})
}));

export const filtersToReportConfigsRelations = relations(filtersToReportConfigs, ({ one }) => ({
	reportElementConfig: one(reportElementConfig, {
		fields: [filtersToReportConfigs.reportElementConfigId],
		references: [reportElementConfig.id]
	}),
	filter: one(filter, {
		fields: [filtersToReportConfigs.filterId],
		references: [filter.id]
	})
}));

export const keyValueTable = pgTable('key_value_table', {
	key: text('key').notNull().unique(),
	value: text('value').notNull()
});

export const backupTable = pgTable('backup_table', {
	...idColumn,
	...timestampColumns,
	title: text('title').notNull(),
	filename: text('filename').notNull().unique(),
	fileExists: boolean('file_exists').notNull(),
	version: integer('version').notNull(),
	restoreDate: timestamp('restore_date'),
	compressed: boolean('compressed').notNull(),
	creationReason: text('creation_reason').notNull(),
	createdBy: text('created_by').notNull(),
	locked: boolean('locked').notNull().default(false),
	information: jsonb('information').$type<CombinedBackupSchemaInfoType>().notNull()
});
