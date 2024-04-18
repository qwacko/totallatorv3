import { fileNoteRelationshipFilterSchema } from '$lib/schema/helpers/fileNoteRelationship';
import { not, type ColumnBaseConfig, type SQL } from 'drizzle-orm';
import type { PgColumn, PgTableWithColumns } from 'drizzle-orm/pg-core';

import { z } from 'zod';
import { inArrayWrapped } from './inArrayWrapped';

const filterCore = z.object(fileNoteRelationshipFilterSchema);
type FilterCoreType = z.infer<typeof filterCore>;

export const noteFileRelationshipQuery = ({
	where,
	filter,
	table
}: {
	where: SQL<unknown>[];
	filter: FilterCoreType;
	table: PgTableWithColumns<{
		name: string;
		schema: undefined;
		columns: {
			transactionId: PgColumn<ColumnBaseConfig<'string', string>>;
			accountId: PgColumn<ColumnBaseConfig<'string', string>>;
			billId: PgColumn<ColumnBaseConfig<'string', string>>;
			budgetId: PgColumn<ColumnBaseConfig<'string', string>>;
			categoryId: PgColumn<ColumnBaseConfig<'string', string>>;
			tagId: PgColumn<ColumnBaseConfig<'string', string>>;
			labelId: PgColumn<ColumnBaseConfig<'string', string>>;
			autoImportId: PgColumn<ColumnBaseConfig<'string', string>>;
			reportId: PgColumn<ColumnBaseConfig<'string', string>>;
			reportElementId: PgColumn<ColumnBaseConfig<'string', string>>;
		};
		dialect: 'pg';
	}>;
}) => {
	if (filter.transactionIdArray && filter.transactionIdArray.length > 0) {
		where.push(inArrayWrapped(table.transactionId, filter.transactionIdArray));
	}
	if (filter.excludeTransactionIdArray && filter.excludeTransactionIdArray.length > 0) {
		where.push(not(inArrayWrapped(table.transactionId, filter.excludeTransactionIdArray)));
	}
	if (filter.accountIdArray && filter.accountIdArray.length > 0) {
		where.push(inArrayWrapped(table.accountId, filter.accountIdArray));
	}
	if (filter.excludeAccountIdArray && filter.excludeAccountIdArray.length > 0) {
		where.push(not(inArrayWrapped(table.accountId, filter.excludeAccountIdArray)));
	}
	if (filter.billIdArray && filter.billIdArray.length > 0) {
		where.push(inArrayWrapped(table.billId, filter.billIdArray));
	}
	if (filter.excludeBillIdArray && filter.excludeBillIdArray.length > 0) {
		where.push(not(inArrayWrapped(table.billId, filter.excludeBillIdArray)));
	}
	if (filter.budgetIdArray && filter.budgetIdArray.length > 0) {
		where.push(inArrayWrapped(table.budgetId, filter.budgetIdArray));
	}
	if (filter.excludeBudgetIdArray && filter.excludeBudgetIdArray.length > 0) {
		where.push(not(inArrayWrapped(table.budgetId, filter.excludeBudgetIdArray)));
	}
	if (filter.categoryIdArray && filter.categoryIdArray.length > 0) {
		where.push(inArrayWrapped(table.categoryId, filter.categoryIdArray));
	}
	if (filter.excludeCategoryIdArray && filter.excludeCategoryIdArray.length > 0) {
		where.push(not(inArrayWrapped(table.categoryId, filter.excludeCategoryIdArray)));
	}
	if (filter.tagIdArray && filter.tagIdArray.length > 0) {
		where.push(inArrayWrapped(table.tagId, filter.tagIdArray));
	}
	if (filter.excludeTagIdArray && filter.excludeTagIdArray.length > 0) {
		where.push(not(inArrayWrapped(table.tagId, filter.excludeTagIdArray)));
	}
};
