import {
	and,
	count,
	eq,
	getTableColumns,
	isNotNull,
	max,
	min,
	or,
	sql,
	SQL,
	sum
} from 'drizzle-orm';
import { PgColumn, pgMaterializedView, pgView } from 'drizzle-orm/pg-core';

import { sqlToText } from '../helpers/sqlToText';
import { customAliasedTableColumn } from './customAliasedTableColumn';
import { filesNotesSubquery } from './filesNotesSubquery';
import { materializedViewTableNames } from './materializedViewTableNames';
import {
	account,
	bill,
	budget,
	category,
	importItemDetail,
	importTable,
	journalEntry,
	label,
	labelsToJournals,
	tag,
	transaction
} from './transactionSchema';

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

export const journalView = pgView('journal_view').as((qb) => {
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

export type JournalViewReturnType = typeof journalView.$inferSelect;

export const journalExtendedView = pgMaterializedView(
	materializedViewTableNames.journalExtendedView
).as((qb) => qb.select().from(journalView));

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

export const accountView = pgView('account_view').as((qb) => {
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

export const accountMaterializedView = pgMaterializedView(
	materializedViewTableNames.accountMaterializedView
).as((qb) => qb.select().from(accountView));

export type AccountViewReturnType = typeof accountView.$inferSelect;

export const billView = pgView('bill_view').as((qb) => {
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

export const billMaterializedView = pgMaterializedView(
	materializedViewTableNames.billMaterializedView
).as((qb) => qb.select().from(billView));

export type BillViewReturnType = typeof billView.$inferSelect;

export const budgetView = pgView('budget_view').as((qb) => {
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

export const budgetMaterializedView = pgMaterializedView(
	materializedViewTableNames.budgetMaterializedView
).as((qb) => qb.select().from(budgetView));

export type BudgetViewReturnType = typeof budgetView.$inferSelect;

export const categoryView = pgView('category_view').as((qb) => {
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

export const categoryMaterializedView = pgMaterializedView(
	materializedViewTableNames.categoryMaterializedView
).as((qb) => qb.select().from(categoryView));

export type CategoryViewReturnType = typeof categoryView.$inferSelect;

export const tagView = pgView('tag_view').as((qb) => {
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

export const tagMaterializedView = pgMaterializedView(
	materializedViewTableNames.tagMaterializedView
).as((qb) => qb.select().from(tagView));

export type TagViewReturnType = typeof tagView.$inferSelect;

export const labelView = pgView('label_view').as((qb) => {
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

export const labelMaterializedView = pgMaterializedView(
	materializedViewTableNames.labelMaterializedView
).as((qb) => qb.select().from(labelView));

export type LabelViewReturnType = typeof labelView.$inferSelect;

export const importCheckView = pgView('import_check_view').as((qb) => {
	return qb
		.select({
			id: importItemDetail.id,
			createdAt: importItemDetail.createdAt,
			relationId: importItemDetail.relationId,
			relation2Id: importItemDetail.relation2Id,
			description: sql<string>`processed_info->'dataToUse'->>'description'`
				.mapWith(String)
				.as('description')
		})
		.from(importItemDetail)
		.where(
			and(
				isNotNull(sql<string>`processed_info->'dataToUse'->>'description'`),
				or(isNotNull(importItemDetail.relationId), isNotNull(importItemDetail.relation2Id))
			)
		);
});

export const importCheckMaterializedView = pgMaterializedView(
	materializedViewTableNames.importCheckMaterializedView
).as((qb) => {
	return qb.select().from(importCheckView);
});

const viewIndexes = [
	{
		title: 'materialized_journal_view_index',
		isUnique: true,
		targetTable: sqlToText(sql`${journalExtendedView}`),
		targetColumn: journalExtendedView.id
	},
	{
		title: 'materialized_account_view_index',
		isUnique: true,
		targetTable: sqlToText(sql`${accountMaterializedView}`),
		targetColumn: accountMaterializedView.id
	},
	{
		title: 'materialized_bill_view_index',
		isUnique: true,
		targetTable: sqlToText(sql`${billMaterializedView}`),
		targetColumn: billMaterializedView.id
	},
	{
		title: 'materialized_budget_view_index',
		isUnique: true,
		targetTable: sqlToText(sql`${budgetMaterializedView}`),
		targetColumn: budgetMaterializedView.id
	},
	{
		title: 'materialized_category_view_index',
		isUnique: true,
		targetTable: sqlToText(sql`${categoryMaterializedView}`),
		targetColumn: categoryMaterializedView.id
	},
	{
		title: 'materialized_tag_view_index',
		isUnique: true,
		targetTable: sqlToText(sql`${tagMaterializedView}`),
		targetColumn: tagMaterializedView.id
	},
	{
		title: 'materialized_label_view_index',
		isUnique: true,
		targetTable: sqlToText(sql`${labelMaterializedView}`),
		targetColumn: labelMaterializedView.id
	},
	{
		title: 'materialized_import_check_view_index',
		isUnique: true,
		targetTable: sqlToText(sql`${importCheckMaterializedView}`),
		targetColumn: importCheckMaterializedView.id
	},
	{
		title: 'materialized_import_check_description_index',
		isUnique: false,
		targetTable: sqlToText(sql`${importCheckMaterializedView}`),
		targetColumn: importCheckMaterializedView.description
	}
] satisfies {
	title: string;
	isUnique: boolean;
	targetTable: string;
	targetColumn: PgColumn | SQL.Aliased;
}[];

export const dropMaterializedIndexes = () => {
	const queries = viewIndexes.map((item) => {
		return sqlToText(sql.raw(`DROP INDEX IF EXISTS "${item.title}"`));
	});

	// console.log(queries.join(''));

	return queries;
};

export const buildMaterializedIndexes = () => {
	const queries = viewIndexes.map((item) => {
		const tableTitle = item.targetTable;
		const columnTitle = sqlToText(sql`${item.targetColumn}`);

		return sqlToText(
			sql.raw(
				`CREATE ${item.isUnique ? 'UNIQUE' : ''} INDEX IF NOT EXISTS "${item.title}" ON ${tableTitle} (${columnTitle})`
			)
		);
	});

	// console.log(queries.join(''));

	return queries;
};
