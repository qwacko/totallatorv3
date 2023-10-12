import type { JournalFilterSchemaType } from '$lib/schema/journalSchema';
import { account, journalEntry, journalsToOtherJournals, transaction } from '../../schema';
import { SQL, and, eq, gt, inArray, like, not } from 'drizzle-orm';
import {
	accountFilterToQuery,
	accountFilterToText,
	accountIdsToTitle
} from './accountFilterToQuery';
import { billFilterToQuery, billFilterToText } from './billFilterToQuery';
import { budgetFilterToQuery, budgetFilterToText } from './budgetFilterToQuery';
import { tagFilterToQuery, tagFilterToText } from './tagFilterToQuery';
import { categoryFilterToQuery, categoryFilterToText } from './categoryFilterToQuery';
import { labelFilterToQuery, labelFilterToText } from './labelFilterToQuery';
import { db } from '../../db';
import { alias } from 'drizzle-orm/sqlite-core';
import { logging } from '$lib/server/logging';

export const journalFilterToQuery = async (
	filter: Omit<JournalFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>
) => {
	const where: SQL<unknown>[] = [];
	if (filter.id) where.push(eq(journalEntry.id, filter.id));
	if (filter.idArray && filter.idArray.length > 0)
		where.push(inArray(journalEntry.id, filter.idArray));
	if (filter.yearMonth && filter.yearMonth.length > 0)
		where.push(inArray(journalEntry.yearMonth, filter.yearMonth));
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

	if (filter.payee) {
		const otherJournal = alias(journalEntry, 'otherJournal');

		const payeeFilter: SQL<unknown>[] = [];

		if (filter.payee.id) {
			payeeFilter.push(eq(otherJournal.accountId, filter.payee.id));
		}
		if (filter.payee.title) {
			payeeFilter.push(like(account.title, `%${filter.payee.title}%`));
		}

		if (filter.payee.idArray && filter.payee.idArray.length > 0) {
			payeeFilter.push(inArray(otherJournal.accountId, filter.payee.idArray));
		}

		const payeeJournalSQ = await db
			.select({ id: journalEntry.id })
			.from(journalEntry)
			.leftJoin(transaction, eq(journalEntry.transactionId, transaction.id))
			.leftJoin(
				otherJournal,
				and(
					eq(otherJournal.transactionId, transaction.id),
					not(eq(otherJournal.id, journalEntry.id))
				)
			)
			.leftJoin(account, eq(otherJournal.accountId, account.id))
			.where(and(...payeeFilter))
			.groupBy(journalEntry.id)
			.execute();

		const allowableJournalIds = payeeJournalSQ.map((x) => x.id);

		where.push(inArray(journalEntry.id, allowableJournalIds));
	}

	return where;
};

export const journalFilterToText = async (
	filter: Omit<JournalFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>,
	{ prefix, allText = true }: { prefix?: string; allText?: boolean } = {}
) => {
	const stringArray: string[] = [];
	if (filter.id) stringArray.push(`ID is ${filter.id}`);
	if (filter.idArray) {
		if (filter.idArray.length === 1) {
			stringArray.push(`ID is ${filter.idArray[0]}`);
		} else if (filter.idArray.length > 4) {
			stringArray.push(`ID is one of  ${filter.idArray.length} values`);
		} else {
			stringArray.push(`ID is one of ${filter.idArray.join(', ')}`);
		}
	}
	if (filter.yearMonth && filter.yearMonth.length > 0) {
		if (filter.yearMonth.length === 1) {
			stringArray.push(`Year-Month is ${filter.yearMonth[0]}`);
		} else if (filter.yearMonth.length > 4) {
			stringArray.push(`Year-Month is one of  ${filter.yearMonth.length} values`);
		} else {
			stringArray.push(`Year-Month is one of ${filter.yearMonth.join(', ')}`);
		}
	}
	if (filter.transactionIdArray) {
		if (filter.transactionIdArray.length === 1) {
			stringArray.push(`Transaction ID is one of ${filter.transactionIdArray.join(', ')}`);
		} else if (filter.transactionIdArray.length > 4) {
			stringArray.push(`Transaction ID is one of ${filter.transactionIdArray.length} values`);
		} else {
			stringArray.push(`Transaction ID is one of ${filter.transactionIdArray.join(', ')} values`);
		}
	}
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

	if (filter.payee?.id) {
		stringArray.push(`Payee is ${await accountIdsToTitle([filter.payee.id])}`);
	}

	const linkedArray: string[] = [];
	if (filter.account) {
		linkedArray.push(
			...(await accountFilterToText(filter.account, { prefix: 'Account', allText: false }))
		);
	}

	if (filter.bill) {
		linkedArray.push(...(await billFilterToText(filter.bill, { prefix: 'Bill', allText: false })));
	}

	if (filter.budget) {
		linkedArray.push(
			...(await budgetFilterToText(filter.budget, { prefix: 'Budget', allText: false }))
		);
	}

	if (filter.category) {
		linkedArray.push(
			...(await categoryFilterToText(filter.category, { prefix: 'Category', allText: false }))
		);
	}

	if (filter.tag) {
		linkedArray.push(...(await tagFilterToText(filter.tag, { prefix: 'Tag', allText: false })));
	}

	if (filter.label) {
		linkedArray.push(
			...(await labelFilterToText(filter.label, { prefix: 'Label', allText: false }))
		);
	}

	const stringArrayWithPrefix = prefix
		? stringArray.map((item) => `${prefix} ${item}`)
		: stringArray;
	const combinedArray = [...stringArrayWithPrefix, ...linkedArray];

	if (combinedArray.length === 0 && allText) {
		combinedArray.push('Showing All');
	}

	return combinedArray;
};
