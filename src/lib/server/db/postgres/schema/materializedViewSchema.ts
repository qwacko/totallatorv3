import {
	eq,
	getTableColumns,
	type ColumnBaseConfig,
	type ColumnDataType,
	sql,
	count,
	sum,
	min,
	max
} from 'drizzle-orm';
import { pgMaterializedView, PgColumn } from 'drizzle-orm/pg-core';
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
	importTable
} from './transactionSchema';

const customAliasedTableColumn = <
	T extends ColumnBaseConfig<ColumnDataType, string> = ColumnBaseConfig<ColumnDataType, string>
>(
	column: PgColumn<T>,
	alias: string
) => {
	return sql<typeof column>`${column}`.as(alias) as unknown as typeof column;
};

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
	return qb
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
			importTitle: customAliasedTableColumn(importTable.title, 'import_title')
		})
		.from(journalEntry)
		.leftJoin(transaction, eq(journalEntry.transactionId, transaction.id))
		.leftJoin(account, eq(journalEntry.accountId, account.id))
		.leftJoin(bill, eq(journalEntry.billId, bill.id))
		.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
		.leftJoin(category, eq(journalEntry.categoryId, category.id))
		.leftJoin(tag, eq(journalEntry.tagId, tag.id))
		.leftJoin(importTable, eq(journalEntry.importId, importTable.id));
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
	return qb
		.select({
			...getTableColumns(account),
			...aggregationColumns(true)
		})
		.from(account)
		.leftJoin(journalEntry, eq(account.id, journalEntry.accountId))
		.groupBy(account.id);
});

export const billMaterializedView = pgMaterializedView(
	materializedViewTableNames.billMaterializedView
).as((qb) => {
	return qb
		.select({
			...getTableColumns(bill),
			...aggregationColumns(false)
		})
		.from(bill)
		.leftJoin(journalEntry, eq(bill.id, journalEntry.billId))
		.leftJoin(account, eq(journalEntry.accountId, account.id))
		.groupBy(bill.id);
});

export const budgetMaterializedView = pgMaterializedView(
	materializedViewTableNames.budgetMaterializedView
).as((qb) => {
	return qb
		.select({
			...getTableColumns(budget),
			...aggregationColumns(false)
		})
		.from(budget)
		.leftJoin(journalEntry, eq(budget.id, journalEntry.budgetId))
		.leftJoin(account, eq(journalEntry.accountId, account.id))
		.groupBy(budget.id);
});

export const categoryMaterializedView = pgMaterializedView(
	materializedViewTableNames.categoryMaterializedView
).as((qb) => {
	return qb
		.select({
			...getTableColumns(category),
			...aggregationColumns(false)
		})
		.from(category)
		.leftJoin(journalEntry, eq(category.id, journalEntry.categoryId))
		.leftJoin(account, eq(journalEntry.accountId, account.id))
		.groupBy(category.id);
});

export const tagMaterializedView = pgMaterializedView(
	materializedViewTableNames.tagMaterializedView
).as((qb) => {
	return qb
		.select({
			...getTableColumns(tag),
			...aggregationColumns(false)
		})
		.from(tag)
		.leftJoin(journalEntry, eq(tag.id, journalEntry.tagId))
		.leftJoin(account, eq(journalEntry.accountId, account.id))
		.groupBy(tag.id);
});

export const labelMaterializedView = pgMaterializedView(
	materializedViewTableNames.labelMaterializedView
).as((qb) => {
	return qb
		.select({
			...getTableColumns(label),
			...aggregationColumns(false)
		})
		.from(label)
		.leftJoin(labelsToJournals, eq(label.id, labelsToJournals.labelId))
		.leftJoin(journalEntry, eq(labelsToJournals.journalId, journalEntry.id))
		.leftJoin(account, eq(journalEntry.accountId, account.id))
		.groupBy(label.id);
});
