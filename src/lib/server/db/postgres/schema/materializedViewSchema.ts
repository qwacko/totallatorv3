import {
	eq,
	getTableColumns,
	type ColumnBaseConfig,
	type ColumnDataType,
	sql,
	count,
	sum,
	min,
	max,
	isNotNull,
	and
} from 'drizzle-orm';
import { pgMaterializedView, PgColumn, QueryBuilder } from 'drizzle-orm/pg-core';
import {
	labelsToJournals,
	label,
	journalEntry,
	account,
	transaction,
	bill,
	budget,
	category,
	tag,
	importTable,
	fileTable,
	notesTable
} from './transactionSchema';
import type { KeysOfCreateFileNoteRelationshipSchemaType } from '$lib/schema/helpers/fileNoteRelationship';

const filesNotesSubquery = (
	qb: QueryBuilder,
	target: KeysOfCreateFileNoteRelationshipSchemaType
) => {
	const withFileQuery = qb.$with('filessq').as(
		qb
			.select({
				id: fileTable[target],
				fileCount: count(fileTable.id).as('file_count')
			})
			.from(fileTable)
			.where(isNotNull(fileTable[target]))
			.groupBy(fileTable[target])
	);

	const withNoteQuery = qb.$with('notessq').as(
		qb
			.select({
				id: notesTable[target],
				noteCount: count(notesTable.id).as('note_count')
			})
			.from(notesTable)
			.where(isNotNull(notesTable[target]))
			.groupBy(notesTable[target])
	);

	const withReminderQuery = qb.$with('reminderssq').as(
		qb
			.select({
				id: notesTable[target],
				reminderCount: count(notesTable.id).as('reminder_count')
			})
			.from(notesTable)
			.where(and(eq(notesTable.type, 'reminder'), isNotNull(notesTable[target])))
			.groupBy(notesTable[target])
	);

	return { withFileQuery, withNoteQuery, withReminderQuery };
};

const customAliasedTableColumn = <
	T extends ColumnBaseConfig<ColumnDataType, string> = ColumnBaseConfig<ColumnDataType, string>
>(
	column: PgColumn<T>,
	alias: string
) => {
	return sql<typeof column>`${column}`.as(alias) as unknown as typeof column;
};

export const dateRangeMaterializedView = pgMaterializedView('date_range_materialized_view').as(
	(qb) => {
		return qb
			.select({
				minDate: min(journalEntry.date).as('minDate'),
				maxDate: max(journalEntry.date).as('maxDate')
			})
			.from(journalEntry);
	}
);

export const materializedViewTableNames = {
	journalExtendedView: 'journal_extended_view',
	accountMaterializedView: 'account_materialized_view',
	billMaterializedView: 'bill_materialized_view',
	budgetMaterializedView: 'budget_materialized_view',
	categoryMaterializedView: 'category_materialized_view',
	tagMaterializedView: 'tag_materialized_view',
	labelMaterializedView: 'label_materialized_view'
};

export const journalExtendedView = pgMaterializedView(
	materializedViewTableNames.journalExtendedView
).as((qb) => {
	const { withFileQuery, withNoteQuery, withReminderQuery } = filesNotesSubquery(
		qb,
		'transactionId'
	);

	return qb
		.with(withFileQuery, withNoteQuery, withReminderQuery)
		.select({
			...getTableColumns(journalEntry),
			transactionId: customAliasedTableColumn(transaction.id, 'transaction_id'),
			accountTitle: account.title,
			accountType: account.type,
			accountIsCash: account.isCash,
			accountIsNetWorth: account.isNetWorth,
			accountGroup: account.accountGroup,
			accountGroup2: account.accountGroup2,
			accountGroup3: account.accountGroup3,
			accountGroupCombined: account.accountGroupCombined,
			accountTitleCombined: account.accountTitleCombined,
			accountStartDate: account.startDate,
			accountEndDate: account.endDate,
			accountStatus: customAliasedTableColumn(account.status, 'account_status'),
			accountActive: customAliasedTableColumn(account.active, 'account_active'),
			accountDisabled: customAliasedTableColumn(account.disabled, 'account_disabled'),
			accountAllowUpdate: customAliasedTableColumn(account.allowUpdate, 'account_allow_update'),
			billTitle: customAliasedTableColumn(bill.title, 'bill_title'),
			billStatus: customAliasedTableColumn(bill.status, 'bill_status'),
			billActive: customAliasedTableColumn(bill.active, 'bill_active'),
			billDisabled: customAliasedTableColumn(bill.disabled, 'bill_disabled'),
			billAllowUpdate: customAliasedTableColumn(bill.allowUpdate, 'bill_allow_update'),
			budgetTitle: customAliasedTableColumn(budget.title, 'budget_title'),
			budgetStatus: customAliasedTableColumn(budget.status, 'budget_status'),
			budgetActive: customAliasedTableColumn(budget.active, 'budget_active'),
			budgetDisabled: customAliasedTableColumn(budget.disabled, 'budget_disabled'),
			budgetAllowUpdate: customAliasedTableColumn(budget.allowUpdate, 'budget_allow_update'),
			categoryTitle: customAliasedTableColumn(category.title, 'category_title'),
			categoryGroup: customAliasedTableColumn(category.group, 'category_group'),
			categorySingle: customAliasedTableColumn(category.single, 'category_single'),
			categoryStatus: customAliasedTableColumn(category.status, 'category_status'),
			categoryActive: customAliasedTableColumn(category.active, 'category_active'),
			categoryDisabled: customAliasedTableColumn(category.disabled, 'category_disabled'),
			categoryAllowUpdate: customAliasedTableColumn(category.allowUpdate, 'category_allow_update'),
			tagTitle: customAliasedTableColumn(tag.title, 'tag_title'),
			tagGroup: customAliasedTableColumn(tag.group, 'tag_group'),
			tagSingle: customAliasedTableColumn(tag.single, 'tag_single'),
			tagStatus: customAliasedTableColumn(tag.status, 'tag_status'),
			tagActive: customAliasedTableColumn(tag.active, 'tag_active'),
			tagDisabled: customAliasedTableColumn(tag.disabled, 'tag_disabled'),
			tagAllowUpdate: customAliasedTableColumn(tag.allowUpdate, 'tag_allow_update'),
			importTitle: customAliasedTableColumn(importTable.title, 'import_title'),
			noteCount: withNoteQuery.noteCount,
			reminderCount: withReminderQuery.reminderCount,
			fileCount: withFileQuery.fileCount,
			all: sql<boolean>`true`.as('all')
		})
		.from(journalEntry)
		.leftJoin(transaction, eq(journalEntry.transactionId, transaction.id))
		.leftJoin(account, eq(journalEntry.accountId, account.id))
		.leftJoin(bill, eq(journalEntry.billId, bill.id))
		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
		.leftJoin(category, eq(journalEntry.categoryId, category.id))
		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
		.leftJoin(importTable, eq(journalEntry.importId, importTable.id))
		.leftJoin(withFileQuery, eq(journalEntry.transactionId, withFileQuery.id))
		.leftJoin(withNoteQuery, eq(journalEntry.transactionId, withNoteQuery.id))
		.leftJoin(withReminderQuery, eq(journalEntry.transactionId, withReminderQuery.id));
});

const aggregationColumns = (isAccount: boolean = false) => ({
	sum: (isAccount
		? sum(journalEntry.amount).mapWith(Number)
		: sql`sum(CASE WHEN ${account.type} IN ('asset', 'liability') THEN ${journalEntry.amount} ELSE 0 END)`.mapWith(
				Number
			)
	).as('sum'),
	count: (isAccount
		? count(journalEntry.id)
		: sql`count(CASE WHEN ${account.type} IN ('asset', 'liability') THEN 1 ELSE NULL END)`.mapWith(
				Number
			)
	).as('count'),
	firstDate: min(journalEntry.date).as('firstDate'),
	lastDate: max(journalEntry.date).as('lastDate')
});

export const accountMaterializedView = pgMaterializedView(
	materializedViewTableNames.accountMaterializedView
).as((qb) => {
	const { withFileQuery, withNoteQuery, withReminderQuery } = filesNotesSubquery(qb, 'accountId');

	return qb
		.with(withFileQuery, withNoteQuery, withReminderQuery)
		.select({
			...getTableColumns(account),
			...aggregationColumns(true),
			noteCount: max(withNoteQuery.noteCount).mapWith(Number).as('note_count'),
			reminderCount: max(withReminderQuery.reminderCount).mapWith(Number).as('reminder_count'),
			fileCount: max(withFileQuery.fileCount).mapWith(Number).as('file_count')
		})
		.from(account)
		.leftJoin(journalEntry, eq(account.id, journalEntry.accountId))
		.leftJoin(importTable, eq(journalEntry.importId, importTable.id))
		.leftJoin(withFileQuery, eq(account.id, withFileQuery.id))
		.leftJoin(withNoteQuery, eq(account.id, withNoteQuery.id))
		.leftJoin(withReminderQuery, eq(account.id, withReminderQuery.id))
		.groupBy(account.id);
});

export const billMaterializedView = pgMaterializedView(
	materializedViewTableNames.billMaterializedView
).as((qb) => {
	const { withFileQuery, withNoteQuery, withReminderQuery } = filesNotesSubquery(qb, 'billId');
	return qb
		.with(withFileQuery, withNoteQuery, withReminderQuery)
		.select({
			...getTableColumns(bill),
			...aggregationColumns(false),
			noteCount: max(withNoteQuery.noteCount).mapWith(Number).as('note_count'),
			reminderCount: max(withReminderQuery.reminderCount).mapWith(Number).as('reminder_count'),
			fileCount: max(withFileQuery.fileCount).mapWith(Number).as('file_count')
		})
		.from(bill)
		.leftJoin(journalEntry, eq(bill.id, journalEntry.billId))
		.leftJoin(account, eq(journalEntry.accountId, account.id))
		.leftJoin(withFileQuery, eq(bill.id, withFileQuery.id))
		.leftJoin(withNoteQuery, eq(bill.id, withNoteQuery.id))
		.leftJoin(withReminderQuery, eq(bill.id, withReminderQuery.id))
		.groupBy(bill.id);
});

export const budgetMaterializedView = pgMaterializedView(
	materializedViewTableNames.budgetMaterializedView
).as((qb) => {
	const { withFileQuery, withNoteQuery, withReminderQuery } = filesNotesSubquery(qb, 'budgetId');
	return qb
		.with(withFileQuery, withNoteQuery, withReminderQuery)
		.select({
			...getTableColumns(budget),
			...aggregationColumns(false),
			noteCount: max(withNoteQuery.noteCount).mapWith(Number).as('note_count'),
			reminderCount: max(withReminderQuery.reminderCount).mapWith(Number).as('reminder_count'),
			fileCount: max(withFileQuery.fileCount).mapWith(Number).as('file_count')
		})
		.from(budget)
		.leftJoin(journalEntry, eq(budget.id, journalEntry.budgetId))
		.leftJoin(account, eq(journalEntry.accountId, account.id))
		.leftJoin(withFileQuery, eq(budget.id, withFileQuery.id))
		.leftJoin(withNoteQuery, eq(budget.id, withNoteQuery.id))
		.leftJoin(withReminderQuery, eq(budget.id, withReminderQuery.id))
		.groupBy(budget.id);
});

export const categoryMaterializedView = pgMaterializedView(
	materializedViewTableNames.categoryMaterializedView
).as((qb) => {
	const { withFileQuery, withNoteQuery, withReminderQuery } = filesNotesSubquery(qb, 'categoryId');

	return qb
		.with(withFileQuery, withNoteQuery, withReminderQuery)
		.select({
			...getTableColumns(category),
			...aggregationColumns(false),
			noteCount: max(withNoteQuery.noteCount).mapWith(Number).as('note_count'),
			reminderCount: max(withReminderQuery.reminderCount).mapWith(Number).as('reminder_count'),
			fileCount: max(withFileQuery.fileCount).mapWith(Number).as('file_count')
		})
		.from(category)
		.leftJoin(journalEntry, eq(category.id, journalEntry.categoryId))
		.leftJoin(account, eq(journalEntry.accountId, account.id))
		.leftJoin(withFileQuery, eq(category.id, withFileQuery.id))
		.leftJoin(withNoteQuery, eq(category.id, withNoteQuery.id))
		.leftJoin(withReminderQuery, eq(category.id, withReminderQuery.id))
		.groupBy(category.id);
});

export const tagMaterializedView = pgMaterializedView(
	materializedViewTableNames.tagMaterializedView
).as((qb) => {
	const { withFileQuery, withNoteQuery, withReminderQuery } = filesNotesSubquery(qb, 'tagId');

	return qb
		.with(withFileQuery, withNoteQuery, withReminderQuery)
		.select({
			...getTableColumns(tag),
			...aggregationColumns(false),
			noteCount: max(withNoteQuery.noteCount).mapWith(Number).as('note_count'),
			reminderCount: max(withReminderQuery.reminderCount).mapWith(Number).as('reminder_count'),
			fileCount: max(withFileQuery.fileCount).mapWith(Number).as('file_count')
		})
		.from(tag)
		.leftJoin(journalEntry, eq(tag.id, journalEntry.tagId))
		.leftJoin(account, eq(journalEntry.accountId, account.id))
		.leftJoin(withFileQuery, eq(tag.id, withFileQuery.id))
		.leftJoin(withNoteQuery, eq(tag.id, withNoteQuery.id))
		.leftJoin(withReminderQuery, eq(tag.id, withReminderQuery.id))
		.groupBy(tag.id);
});

export const labelMaterializedView = pgMaterializedView(
	materializedViewTableNames.labelMaterializedView
).as((qb) => {
	const { withFileQuery, withNoteQuery, withReminderQuery } = filesNotesSubquery(qb, 'labelId');

	return qb
		.with(withFileQuery, withNoteQuery, withReminderQuery)
		.select({
			...getTableColumns(label),
			...aggregationColumns(false),
			noteCount: max(withNoteQuery.noteCount).mapWith(Number).as('note_count'),
			reminderCount: max(withReminderQuery.reminderCount).mapWith(Number).as('reminder_count'),
			fileCount: max(withFileQuery.fileCount).mapWith(Number).as('file_count')
		})
		.from(label)
		.leftJoin(labelsToJournals, eq(label.id, labelsToJournals.labelId))
		.leftJoin(journalEntry, eq(labelsToJournals.journalId, journalEntry.id))
		.leftJoin(account, eq(journalEntry.accountId, account.id))
		.leftJoin(withFileQuery, eq(label.id, withFileQuery.id))
		.leftJoin(withNoteQuery, eq(label.id, withNoteQuery.id))
		.leftJoin(withReminderQuery, eq(label.id, withReminderQuery.id))
		.groupBy(label.id);
});
