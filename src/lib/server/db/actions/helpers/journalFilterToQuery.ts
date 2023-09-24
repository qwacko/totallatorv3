import type { JournalFilterSchemaType } from '$lib/schema/journalSchema';
import { journalEntry } from '../../schema';
import { SQL, eq, gt, inArray, like } from 'drizzle-orm';
import { accountFilterToQuery } from './accountFilterToQuery';
import { billFilterToQuery } from './billFilterToQuery';
import { budgetFilterToQuery } from './budgetFilterToQuery';
import { tagFilterToQuery } from './tagFilterToQuery';
import { categoryFilterToQuery } from './categoryFilterToQuery';
import { labelFilterToQuery } from './labelFilterToQuery';

export const journalFilterToQuery = (
	filter: Omit<JournalFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>
) => {
	const where: SQL<unknown>[] = [];
	if (filter.id) where.push(eq(journalEntry.id, filter.id));
	if (filter.idArray) where.push(inArray(journalEntry.id, filter.idArray));
	if (filter.transactionIdArray)
		where.push(inArray(journalEntry.transactionId, filter.transactionIdArray));
	if (filter.description) where.push(like(journalEntry.description, `%${filter.description}%`));
	if (filter.dateAfter !== undefined) where.push(gt(journalEntry.dateText, filter.dateAfter));
	if (filter.dateBefore !== undefined) where.push(gt(journalEntry.dateText, filter.dateBefore));
	if (filter.complete !== undefined) where.push(eq(journalEntry.complete, filter.complete));
	if (filter.linked !== undefined) where.push(eq(journalEntry.linked, filter.linked));
	if (filter.dataChecked !== undefined)
		where.push(eq(journalEntry.dataChecked, filter.dataChecked));
	if (filter.reconciled !== undefined) where.push(eq(journalEntry.reconciled, filter.reconciled));

	if (filter.account) {
		const accountFilter = accountFilterToQuery(filter.account);
		where.push(...accountFilter);
	}

	if (filter.bill) {
		const billFilter = billFilterToQuery(filter.bill);
		where.push(...billFilter);
	}

	if (filter.budget) {
		const budgetFilter = budgetFilterToQuery(filter.budget);
		where.push(...budgetFilter);
	}

	if (filter.category) {
		const categoryFilter = categoryFilterToQuery(filter.category);
		where.push(...categoryFilter);
	}

	if (filter.tag) {
		const tagFilter = tagFilterToQuery(filter.tag);
		where.push(...tagFilter);
	}

	if (filter.label) {
		const labelFilter = labelFilterToQuery(filter.label);
		where.push(...labelFilter);
	}

	return where;
};
