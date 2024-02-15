import type { JournalFilterSchemaType } from '$lib/schema/journalSchema';
import { journalEntry } from '../../../postgres/schema';
import { SQL, eq, gte, lte, inArray, ilike, not, notInArray } from 'drizzle-orm';
import {
	accountFilterToQuery,
	accountFilterToText,
	accountIdsToTitles
} from '../account/accountFilterToQuery';
import { billFilterToQuery, billFilterToText } from '../bill/billFilterToQuery';
import { budgetFilterToQuery, budgetFilterToText } from '../budget/budgetFilterToQuery';
import { tagFilterToQuery, tagFilterToText } from '../tag/tagFilterToQuery';
import { categoryFilterToQuery, categoryFilterToText } from '../category/categoryFilterToQuery';
import { labelFilterToSubQuery, labelFilterToText } from '../label/labelFilterToQuery';
import { type DBType } from '../../../db';
import { arrayToText } from '../misc/arrayToText';
import { importIdsToTitles } from '../import/importIdsToTitles';
import { journalPayeeToSubquery } from './journalPayeeToSubquery';
import { dateSpanInfo } from '$lib/schema/dateSpanSchema';

export const journalFilterToQuery = async (
	db: DBType,
	filter: Omit<JournalFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>,
	{ firstMonthOfFY }: { firstMonthOfFY: number } = { firstMonthOfFY: 1 }
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
	if (filter.description) where.push(ilike(journalEntry.description, `%${filter.description}%`));
	if (filter.excludeDescription)
		where.push(not(ilike(journalEntry.description, `%${filter.excludeDescription}%`)));
	if (filter.dateSpan) {
		const dateSpan = dateSpanInfo[filter.dateSpan];
		const startDate = dateSpan.getStartDate({ currentDate: new Date(), firstMonthOfFY });
		const endDate = dateSpan.getEndDate({ currentDate: new Date(), firstMonthOfFY });

		where.push(gte(journalEntry.date, startDate));
		where.push(lte(journalEntry.date, endDate));
	}
	if (filter.dateAfter) where.push(gte(journalEntry.dateText, filter.dateAfter));
	if (filter.dateBefore) where.push(lte(journalEntry.dateText, filter.dateBefore));
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
		const accountFilter = accountFilterToQuery({
			filter: filter.account,
			target: 'account'
		});
		where.push(...accountFilter);
	}
	if (filter.excludeAccount) {
		const excludeAccountFilter = accountFilterToQuery({
			filter: filter.excludeAccount,
			target: 'account'
		});
		where.push(...excludeAccountFilter.map((x) => not(x)));
	}

	if (filter.bill) {
		const billFilter = billFilterToQuery({ filter: filter.bill, target: 'bill' });
		where.push(...billFilter);
	}
	if (filter.excludeBill) {
		const excludeBillFilter = billFilterToQuery({ filter: filter.excludeBill, target: 'bill' });
		where.push(...excludeBillFilter.map((x) => not(x)));
	}

	if (filter.budget) {
		const budgetFilter = budgetFilterToQuery({
			filter: filter.budget,
			target: 'materializedJournals'
		});
		where.push(...budgetFilter);
	}
	if (filter.excludeBudget) {
		const excludeBudgetFilter = budgetFilterToQuery({
			filter: filter.excludeBudget,
			target: 'materializedJournals'
		});
		where.push(...excludeBudgetFilter.map((x) => not(x)));
	}

	if (filter.category) {
		const categoryFilter = categoryFilterToQuery({ filter: filter.category, target: 'category' });
		where.push(...categoryFilter);
	}
	if (filter.excludeCategory) {
		const excludeCategoryFilter = categoryFilterToQuery({
			filter: filter.excludeCategory,
			target: 'category'
		});
		where.push(...excludeCategoryFilter.map((x) => not(x)));
	}

	if (filter.tag) {
		const tagFilter = tagFilterToQuery({ filter: filter.tag, target: 'tag' });
		where.push(...tagFilter);
	}
	if (filter.excludeTag) {
		const excludeTagFilter = tagFilterToQuery({ filter: filter.excludeTag, target: 'tag' });
		where.push(...excludeTagFilter.map((x) => not(x)));
	}

	if (filter.label) {
		where.push(inArray(journalEntry.id, labelFilterToSubQuery({ filter: filter.label, db })));
	}

	if (filter.excludeLabel) {
		where.push(
			notInArray(journalEntry.id, labelFilterToSubQuery({ filter: filter.excludeLabel, db }))
		);
	}

	if (filter.payee) {
		where.push(inArray(journalEntry.id, journalPayeeToSubquery({ db, payee: filter.payee })));
	}

	if (filter.excludePayee) {
		where.push(
			notInArray(journalEntry.id, journalPayeeToSubquery({ db, payee: filter.excludePayee }))
		);
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
	if (filter.dateAfter) stringArray.push(`Date is after ${filter.dateAfter}`);
	if (filter.dateBefore) stringArray.push(`Date is before ${filter.dateBefore}`);
	if (filter.dateSpan) {
		const dateSpan = dateSpanInfo[filter.dateSpan];
		stringArray.push(`Date is in ${dateSpan.title}`);
	}
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
				inputToText: (title) => importIdsToTitles(db, title)
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
			...(await categoryFilterToText({
				db,
				filter: filter.category,
				prefix: 'Category',
				allText: false
			}))
		);
	}
	if (filter.excludeCategory) {
		linkedArray.push(
			...(await categoryFilterToText({
				db,
				filter: filter.excludeCategory,
				prefix: 'Exclude Category',
				allText: false
			}))
		);
	}

	if (filter.tag) {
		linkedArray.push(
			...(await tagFilterToText({ db, filter: filter.tag, prefix: 'Tag', allText: false }))
		);
	}
	if (filter.excludeTag) {
		linkedArray.push(
			...(await tagFilterToText({
				db,
				filter: filter.excludeTag,
				prefix: 'Exclude Tag',
				allText: false
			}))
		);
	}

	if (filter.label) {
		linkedArray.push(
			...(await labelFilterToText({ db, filter: filter.label, prefix: 'Label', allText: false }))
		);
	}

	if (filter.excludeLabel) {
		linkedArray.push(
			...(await labelFilterToText({
				db,
				filter: filter.excludeLabel,
				prefix: 'Exclude Label',
				allText: false
			}))
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
