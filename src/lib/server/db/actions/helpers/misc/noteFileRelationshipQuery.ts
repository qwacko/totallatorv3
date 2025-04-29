import { fileNoteRelationshipFilterSchema } from '$lib/schema/helpers/fileNoteRelationship';
import { not, type SQL } from 'drizzle-orm';

import { z } from 'zod';
import { inArrayWrapped } from './inArrayWrapped';
import { associatedInfoTable } from '$lib/server/db/postgres/schema';

const filterCore = z.object(fileNoteRelationshipFilterSchema);
type FilterCoreType = z.infer<typeof filterCore>;

const table = associatedInfoTable;

export const noteFileRelationshipQuery = ({
	where,
	filter
}: {
	where: SQL<unknown>[];
	filter: FilterCoreType;
}) => {
	if (filter.assocaitedInfoIdArray && filter.assocaitedInfoIdArray.length > 0) {
		where.push(inArrayWrapped(associatedInfoTable.id, filter.assocaitedInfoIdArray));
	}
	if (filter.excludeAssociatedInfoIdArray && filter.excludeAssociatedInfoIdArray.length > 0) {
		where.push(not(inArrayWrapped(associatedInfoTable.id, filter.excludeAssociatedInfoIdArray)));
	}
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
