import type { JournalFilterSchemaType } from '$lib/schema/journalSchema';
import { journalEntry } from '../../schema';
import { SQL, eq, gt, inArray, like } from 'drizzle-orm';
import { accountFilterToQuery, accountFilterToText } from './accountFilterToQuery';
import { billFilterToQuery, billFilterToText } from './billFilterToQuery';
import { budgetFilterToQuery, budgetFilterToText } from './budgetFilterToQuery';
import { tagFilterToQuery, tagFilterToText } from './tagFilterToQuery';
import { categoryFilterToQuery, categoryFilterToText } from './categoryFilterToQuery';
import { labelFilterToQuery, labelFilterToText } from './labelFilterToQuery';

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

export const journalFilterToText = async (
	filter: Omit<JournalFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>,
	prefix?: string
) => {
	const stringArray: string[] = [];
	if (filter.id) stringArray.push(`ID is ${filter.id}`);
	if (filter.idArray) stringArray.push(`ID is one of ${filter.idArray.join(', ')}`);
	if (filter.transactionIdArray)
		stringArray.push(`Transaction ID is one of ${filter.transactionIdArray.join(', ')}`);
	if (filter.description) stringArray.push(`Description contains ${filter.description}`);
	if (filter.dateAfter !== undefined) stringArray.push(`Date is after ${filter.dateAfter}`);
	if (filter.dateBefore !== undefined) stringArray.push(`Date is before ${filter.dateBefore}`);
	if (filter.complete !== undefined)
		stringArray.push(`Is ${filter.complete ? 'Complete' : 'Incomplete'}`);
	if (filter.linked !== undefined)
		stringArray.push(`Is ${filter.linked ? 'Linked' : 'Not Linked'}`);
	if (filter.dataChecked !== undefined)
		stringArray.push(filter.dataChecked ? 'Has had data checked' : "Hasn't had data checked");
	if (filter.reconciled !== undefined)
		stringArray.push(filter.reconciled ? 'Is Reconciled' : 'Is Not Reconciled');

	const linkedArray: string[] = [];
	if (filter.account) {
		linkedArray.push(...(await accountFilterToText(filter.account, 'Account')));
	}

	if (filter.bill) {
		linkedArray.push(...(await billFilterToText(filter.bill, 'Bill')));
	}

	if (filter.budget) {
		linkedArray.push(...(await budgetFilterToText(filter.budget, 'Budget')));
	}

	if (filter.category) {
		linkedArray.push(...(await categoryFilterToText(filter.category, 'Category')));
	}

	if (filter.tag) {
		linkedArray.push(...(await tagFilterToText(filter.tag, 'Tag')));
	}

	if (filter.label) {
		linkedArray.push(...(await labelFilterToText(filter.label, 'Label')));
	}

	const stringArrayWithPrefix = prefix
		? stringArray.map((item) => `${prefix} ${item}`)
		: stringArray;
	const combinedArray = [...stringArrayWithPrefix, ...linkedArray];

	if (combinedArray.length === 0) {
		combinedArray.push('Showing All');
	}

	return combinedArray;
};
