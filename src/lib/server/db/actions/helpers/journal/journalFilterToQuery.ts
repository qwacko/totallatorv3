import type { JournalFilterSchemaType } from '$lib/schema/journalSchema';
import { account, journalEntry, label, labelsToJournals, transaction } from '../../../schema';
import { SQL, and, eq, gte, lte, inArray, like, not, notInArray } from 'drizzle-orm';
import {
	accountFilterToQuery,
	accountFilterToText,
	accountIdsToTitles
} from '../account/accountFilterToQuery';
import { billFilterToQuery, billFilterToText } from '../bill/billFilterToQuery';
import { budgetFilterToQuery, budgetFilterToText } from '../budget/budgetFilterToQuery';
import { tagFilterToQuery, tagFilterToText } from '../tag/tagFilterToQuery';
import { categoryFilterToQuery, categoryFilterToText } from '../category/categoryFilterToQuery';
import { labelFilterToQuery, labelFilterToText } from '../label/labelFilterToQuery';
import { db, type DBType } from '../../../db';
import { alias } from 'drizzle-orm/sqlite-core';
import { arrayToText } from '../misc/arrayToText';
import { importIdsToTitles } from '../import/importIdsToTitles';

export const journalFilterToQuery = async (
	filter: Omit<JournalFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>
) => {
	const where: SQL<unknown>[] = [];
	if (filter.id) where.push(eq(journalEntry.id, filter.id));
	if (filter.excludeId) where.push(not(eq(journalEntry.id, filter.excludeId)));
	if (filter.idArray && filter.idArray.length > 0)
		where.push(inArray(journalEntry.id, filter.idArray));
	if (filter.excludeIdArray && filter.excludeIdArray.length > 0)
		where.push(notInArray(journalEntry.id, filter.excludeIdArray));
	if (filter.maxAmount !== undefined) where.push(lte(journalEntry.amount, filter.maxAmount));
	if (filter.minAmount !== undefined) where.push(gte(journalEntry.amount, filter.minAmount));
	if (filter.yearMonth && filter.yearMonth.length > 0)
		where.push(inArray(journalEntry.yearMonth, filter.yearMonth));
	if (filter.excludeYearMonth && filter.excludeYearMonth.length > 0)
		where.push(notInArray(journalEntry.yearMonth, filter.excludeYearMonth));
	if (filter.transactionIdArray && filter.transactionIdArray.length > 0)
		where.push(inArray(journalEntry.transactionId, filter.transactionIdArray));
	if (filter.excludeTransactionIdArray && filter.excludeTransactionIdArray.length > 0)
		where.push(notInArray(journalEntry.transactionId, filter.excludeTransactionIdArray));
	if (filter.description) where.push(like(journalEntry.description, `%${filter.description}%`));
	if (filter.excludeDescription)
		where.push(not(like(journalEntry.description, `%${filter.excludeDescription}%`)));
	if (filter.dateAfter !== undefined) where.push(gte(journalEntry.dateText, filter.dateAfter));
	if (filter.dateBefore !== undefined) where.push(lte(journalEntry.dateText, filter.dateBefore));
	if (filter.transfer !== undefined) where.push(eq(journalEntry.transfer, filter.transfer));
	if (filter.complete !== undefined) where.push(eq(journalEntry.complete, filter.complete));
	if (filter.linked !== undefined) where.push(eq(journalEntry.linked, filter.linked));
	if (filter.dataChecked !== undefined)
		where.push(eq(journalEntry.dataChecked, filter.dataChecked));
	if (filter.reconciled !== undefined) where.push(eq(journalEntry.reconciled, filter.reconciled));
	if (filter.importIdArray && filter.importIdArray.length > 0)
		where.push(inArray(journalEntry.importId, filter.importIdArray));
	if (filter.importDetailIdArray && filter.importDetailIdArray.length > 0)
		where.push(inArray(journalEntry.importDetailId, filter.importDetailIdArray));

	if (filter.account) {
		const accountFilter = accountFilterToQuery(filter.account);
		where.push(...accountFilter);
	}
	if (filter.excludeAccount) {
		const excludeAccountFilter = accountFilterToQuery(filter.excludeAccount);
		where.push(...excludeAccountFilter.map((x) => not(x)));
	}

	if (filter.bill) {
		const billFilter = billFilterToQuery(filter.bill);
		where.push(...billFilter);
	}
	if (filter.excludeBill) {
		const excludeBillFilter = billFilterToQuery(filter.excludeBill);
		where.push(...excludeBillFilter.map((x) => not(x)));
	}

	if (filter.budget) {
		const budgetFilter = budgetFilterToQuery(filter.budget);
		where.push(...budgetFilter);
	}
	if (filter.excludeBudget) {
		const excludeBudgetFilter = budgetFilterToQuery(filter.excludeBudget);
		where.push(...excludeBudgetFilter.map((x) => not(x)));
	}

	if (filter.category) {
		const categoryFilter = categoryFilterToQuery(filter.category);
		where.push(...categoryFilter);
	}
	if (filter.excludeCategory) {
		const excludeCategoryFilter = categoryFilterToQuery(filter.excludeCategory);
		where.push(...excludeCategoryFilter.map((x) => not(x)));
	}

	if (filter.tag) {
		const tagFilter = tagFilterToQuery(filter.tag);
		where.push(...tagFilter);
	}
	if (filter.excludeTag) {
		const excludeTagFilter = tagFilterToQuery(filter.excludeTag);
		where.push(...excludeTagFilter.map((x) => not(x)));
	}

	if (filter.label) {
		const labelFilter = labelFilterToQuery(filter.label);
		if (labelFilter.length > 0) {
			const labelIds = await db
				.select({ id: journalEntry.id })
				.from(journalEntry)
				.leftJoin(labelsToJournals, eq(labelsToJournals.journalId, journalEntry.id))
				.leftJoin(label, eq(label.id, labelsToJournals.labelId))
				.where(and(...labelFilter))
				.groupBy(journalEntry.id)
				.execute();

			const allowableJournalIds = labelIds.map((x) => x.id);

			if (allowableJournalIds.length === 0) {
				where.push(eq(journalEntry.id, 'nothing'));
			} else {
				where.push(inArray(journalEntry.id, allowableJournalIds));
			}
		}
	}

	if (filter.excludeLabel) {
		const labelExcludeFilter = labelFilterToQuery(filter.excludeLabel);
		if (labelExcludeFilter.length > 0) {
			const labelIds = await db
				.select({ id: journalEntry.id })
				.from(journalEntry)
				.leftJoin(labelsToJournals, eq(labelsToJournals.journalId, journalEntry.id))
				.leftJoin(label, eq(label.id, labelsToJournals.labelId))
				.where(and(...labelExcludeFilter))
				.groupBy(journalEntry.id)
				.execute();

			const allowableJournalIds = labelIds.map((x) => x.id);

			if (allowableJournalIds.length === 0) {
				where.push(eq(journalEntry.id, 'nothing'));
			} else {
				where.push(notInArray(journalEntry.id, allowableJournalIds));
			}
		}
	}

	if (filter.payee) {
		const allowedJournalIds = await payeeToFilter(filter.payee);
		if (allowedJournalIds) {
			where.push(inArray(journalEntry.id, allowedJournalIds));
		}
	}

	if (filter.excludePayee) {
		const disallowedJournalIds = await payeeToFilter(filter.excludePayee);
		if (disallowedJournalIds) {
			where.push(notInArray(journalEntry.id, disallowedJournalIds));
		}
	}

	return where;
};

export const journalFilterToText = async ({
	filter,
	prefix,
	allText = true,
	db
}: {
	filter: Omit<JournalFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>;
	prefix?: string;
	allText?: boolean;
	db: DBType;
}) => {
	const stringArray: string[] = [];
	if (filter.id) stringArray.push(`ID is ${filter.id}`);
	if (filter.excludeId) stringArray.push(`ID is not ${filter.excludeId}`);
	if (filter.idArray) {
		stringArray.push(await arrayToText({ data: filter.idArray, singularName: 'ID' }));
	}
	if (filter.excludeIdArray && filter.excludeIdArray.length > 0) {
		stringArray.push(
			await arrayToText({ data: filter.excludeIdArray, singularName: 'Exclude ID' })
		);
	}
	if (filter.maxAmount !== undefined) stringArray.push(`Amount < ${filter.maxAmount}`);
	if (filter.minAmount !== undefined) stringArray.push(`Amount > ${filter.minAmount}`);

	if (filter.yearMonth && filter.yearMonth.length > 0) {
		stringArray.push(await arrayToText({ data: filter.yearMonth, singularName: 'Year-Month' }));
	}
	if (filter.excludeYearMonth && filter.excludeYearMonth.length > 0) {
		stringArray.push(
			`Exclude ${await arrayToText({ data: filter.excludeYearMonth, singularName: 'Year-Month' })}`
		);
	}
	if (filter.transactionIdArray && filter.transactionIdArray.length > 0) {
		stringArray.push(
			await arrayToText({ data: filter.transactionIdArray, singularName: 'Transaction ID' })
		);
	}
	if (filter.excludeTransactionIdArray && filter.excludeTransactionIdArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: filter.excludeTransactionIdArray,
				singularName: 'Exclude Transaction ID'
			})
		);
	}
	if (filter.description) stringArray.push(`Description contains ${filter.description}`);
	if (filter.excludeDescription)
		stringArray.push(`Exclude Description contains ${filter.excludeDescription}`);
	if (filter.dateAfter !== undefined) stringArray.push(`Date is after ${filter.dateAfter}`);
	if (filter.dateBefore !== undefined) stringArray.push(`Date is before ${filter.dateBefore}`);
	if (filter.transfer !== undefined)
		stringArray.push(`Is ${filter.transfer ? 'Transfer' : 'Not A Transfer'}`);
	if (filter.complete !== undefined)
		stringArray.push(`Is ${filter.complete ? 'Complete' : 'Incomplete'}`);
	if (filter.linked !== undefined)
		stringArray.push(`Is ${filter.linked ? 'Linked' : 'Not Linked'}`);
	if (filter.dataChecked !== undefined)
		stringArray.push(filter.dataChecked ? 'Has had data checked' : "Hasn't had data checked");
	if (filter.reconciled !== undefined)
		stringArray.push(filter.reconciled ? 'Is Reconciled' : 'Is Not Reconciled');
	if (filter.importIdArray && filter.importIdArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: filter.importIdArray,
				singularName: 'Import',
				inputToText: importIdsToTitles
			})
		);
	if (filter.importDetailIdArray && filter.importDetailIdArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: filter.importDetailIdArray,
				singularName: 'Import Detail ID'
			})
		);

	const linkedArray: string[] = [];
	if (filter.account) {
		linkedArray.push(
			...(await accountFilterToText({
				filter: filter.account,
				prefix: 'Account',
				allText: false,
				db
			}))
		);
	}

	if (filter.excludeAccount) {
		linkedArray.push(
			...(await accountFilterToText({
				filter: filter.excludeAccount,
				prefix: 'Exclude Account',
				allText: false,
				db
			}))
		);
	}

	if (filter.bill) {
		linkedArray.push(
			...(await billFilterToText({ db, filter: filter.bill, prefix: 'Bill', allText: false }))
		);
	}
	if (filter.excludeBill) {
		linkedArray.push(
			...(await billFilterToText({
				db,
				filter: filter.excludeBill,
				prefix: 'Exclude Bill',
				allText: false
			}))
		);
	}

	if (filter.budget) {
		linkedArray.push(
			...(await budgetFilterToText({ db, filter: filter.budget, prefix: 'Budget', allText: false }))
		);
	}
	if (filter.excludeBudget) {
		linkedArray.push(
			...(await budgetFilterToText({
				db,
				filter: filter.excludeBudget,
				prefix: 'Exclude Budget',
				allText: false
			}))
		);
	}

	if (filter.category) {
		linkedArray.push(
			...(await categoryFilterToText(filter.category, { prefix: 'Category', allText: false }))
		);
	}
	if (filter.excludeCategory) {
		linkedArray.push(
			...(await categoryFilterToText(filter.excludeCategory, {
				prefix: 'Exclude Category',
				allText: false
			}))
		);
	}

	if (filter.tag) {
		linkedArray.push(...(await tagFilterToText(filter.tag, { prefix: 'Tag', allText: false })));
	}
	if (filter.excludeTag) {
		linkedArray.push(
			...(await tagFilterToText(filter.excludeTag, { prefix: 'Exclude Tag', allText: false }))
		);
	}

	if (filter.label) {
		linkedArray.push(
			...(await labelFilterToText(filter.label, { prefix: 'Label', allText: false }))
		);
	}

	if (filter.excludeLabel) {
		linkedArray.push(
			...(await labelFilterToText(filter.excludeLabel, { prefix: 'Exclude Label', allText: false }))
		);
	}

	if (filter.payee?.id) {
		linkedArray.push(`Payee is ${await accountIdsToTitles(db, [filter.payee.id])}`);
	}
	if (filter.excludePayee?.id) {
		linkedArray.push(`Exclude Payee is ${await accountIdsToTitles(db, [filter.excludePayee.id])}`);
	}

	if (filter.payee?.title) {
		linkedArray.push(`Payee Title contains ${filter.payee.title}`);
	}
	if (filter.excludePayee?.title) {
		linkedArray.push(`Exclude Payee Title contains ${filter.excludePayee.title}`);
	}

	if (filter.payee?.idArray) {
		linkedArray.push(
			await arrayToText({
				data: filter.payee.idArray,
				singularName: 'Payee',
				inputToText: (inputValue) => accountIdsToTitles(db, inputValue)
			})
		);
	}
	if (filter.excludePayee?.idArray) {
		linkedArray.push(
			await arrayToText({
				data: filter.excludePayee.idArray,
				singularName: 'Exclude Payee',
				inputToText: (inputValue) => accountIdsToTitles(db, inputValue)
			})
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

async function payeeToFilter(payee: { id?: string; idArray?: string[]; title?: string }) {
	const otherJournal = alias(journalEntry, 'otherJournal');

	const payeeFilter: SQL<unknown>[] = [];

	if (payee.id) {
		payeeFilter.push(eq(otherJournal.accountId, payee.id));
	}
	if (payee.title) {
		payeeFilter.push(like(account.title, `%${payee.title}%`));
	}

	if (payee.idArray && payee.idArray.length > 0) {
		payeeFilter.push(inArray(otherJournal.accountId, payee.idArray));
	}

	const payeeJournalSQ = await db
		.select({ id: journalEntry.id })
		.from(journalEntry)
		.leftJoin(transaction, eq(journalEntry.transactionId, transaction.id))
		.leftJoin(
			otherJournal,
			and(eq(otherJournal.transactionId, transaction.id), not(eq(otherJournal.id, journalEntry.id)))
		)
		.leftJoin(account, eq(otherJournal.accountId, account.id))
		.where(and(...payeeFilter))
		.groupBy(journalEntry.id)
		.execute();

	const allowableJournalIds = payeeJournalSQ.map((x) => x.id);

	if (allowableJournalIds.length === 0) {
		return undefined;
	} else {
		return allowableJournalIds;
	}
}
