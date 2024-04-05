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
import { ilikeArrayWrapped, inArrayWrapped, notInArrayWrapped } from '../misc/inArrayWrapped';
import { processJournalTextFilter } from './processJournalTextFilter';

export const journalFilterToQuery = async (
	db: DBType,
	filterIn: Omit<JournalFilterSchemaType, 'page' | 'pageSize' | 'orderBy'>,
	{ firstMonthOfFY }: { firstMonthOfFY: number } = { firstMonthOfFY: 1 }
) => {
	const filter = processJournalTextFilter(JSON.parse(JSON.stringify(filterIn)));

	const where: SQL<unknown>[] = [];

	if (filter.id) where.push(eq(journalEntry.id, filter.id));
	if (filter.excludeId) where.push(not(eq(journalEntry.id, filter.excludeId)));
	if (filter.idArray && filter.idArray.length > 0)
		where.push(inArrayWrapped(journalEntry.id, filter.idArray));
	if (filter.excludeIdArray && filter.excludeIdArray.length > 0)
		where.push(notInArrayWrapped(journalEntry.id, filter.excludeIdArray));
	if (filter.maxAmount !== undefined) where.push(lte(journalEntry.amount, filter.maxAmount));
	if (filter.minAmount !== undefined) where.push(gte(journalEntry.amount, filter.minAmount));
	if (filter.yearMonth && filter.yearMonth.length > 0)
		where.push(inArrayWrapped(journalEntry.yearMonth, filter.yearMonth));
	if (filter.excludeYearMonth && filter.excludeYearMonth.length > 0)
		where.push(notInArrayWrapped(journalEntry.yearMonth, filter.excludeYearMonth));
	if (filter.transactionIdArray && filter.transactionIdArray.length > 0)
		where.push(inArrayWrapped(journalEntry.transactionId, filter.transactionIdArray));
	if (filter.excludeTransactionIdArray && filter.excludeTransactionIdArray.length > 0)
		where.push(notInArrayWrapped(journalEntry.transactionId, filter.excludeTransactionIdArray));
	if (filter.description) where.push(ilike(journalEntry.description, `%${filter.description}%`));
	if (filter.excludeDescription)
		where.push(not(ilike(journalEntry.description, `%${filter.excludeDescription}%`)));
	if (filter.descriptionArray && filter.descriptionArray.length > 0) {
		where.push(ilikeArrayWrapped(journalEntry.description, filter.descriptionArray));
	}
	if (filter.excludeDescriptionArray && filter.excludeDescriptionArray.length > 0) {
		where.push(not(ilikeArrayWrapped(journalEntry.description, filter.excludeDescriptionArray)));
	}
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
		where.push(inArrayWrapped(journalEntry.importId, filter.importIdArray));
	if (filter.importDetailIdArray && filter.importDetailIdArray.length > 0)
		where.push(inArrayWrapped(journalEntry.importDetailId, filter.importDetailIdArray));

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
	const filterInternal = processJournalTextFilter(JSON.parse(JSON.stringify(filter)));

	const stringArray: string[] = [];
	if (filterInternal.id) stringArray.push(`ID is ${filterInternal.id}`);
	if (filterInternal.excludeId) stringArray.push(`ID is not ${filterInternal.excludeId}`);
	if (filterInternal.idArray) {
		stringArray.push(await arrayToText({ data: filterInternal.idArray, singularName: 'ID' }));
	}
	if (filterInternal.excludeIdArray && filterInternal.excludeIdArray.length > 0) {
		stringArray.push(
			await arrayToText({ data: filterInternal.excludeIdArray, singularName: 'Exclude ID' })
		);
	}
	if (filterInternal.maxAmount !== undefined)
		stringArray.push(`Amount < ${filterInternal.maxAmount}`);
	if (filterInternal.minAmount !== undefined)
		stringArray.push(`Amount > ${filterInternal.minAmount}`);

	if (filterInternal.yearMonth && filterInternal.yearMonth.length > 0) {
		stringArray.push(
			await arrayToText({ data: filterInternal.yearMonth, singularName: 'Year-Month' })
		);
	}
	if (filterInternal.excludeYearMonth && filterInternal.excludeYearMonth.length > 0) {
		stringArray.push(
			`Exclude ${await arrayToText({ data: filterInternal.excludeYearMonth, singularName: 'Year-Month' })}`
		);
	}
	if (filterInternal.transactionIdArray && filterInternal.transactionIdArray.length > 0) {
		stringArray.push(
			await arrayToText({ data: filterInternal.transactionIdArray, singularName: 'Transaction ID' })
		);
	}
	if (
		filterInternal.excludeTransactionIdArray &&
		filterInternal.excludeTransactionIdArray.length > 0
	) {
		stringArray.push(
			await arrayToText({
				data: filterInternal.excludeTransactionIdArray,
				singularName: 'Exclude Transaction ID'
			})
		);
	}
	if (filterInternal.description)
		stringArray.push(`Description contains ${filterInternal.description}`);
	if (filterInternal.excludeDescription)
		stringArray.push(`Exclude Description contains ${filterInternal.excludeDescription}`);
	if (filterInternal.descriptionArray && filterInternal.descriptionArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: filterInternal.descriptionArray,
				singularName: 'Description',
				midText: 'contains'
			})
		);
	}
	if (filterInternal.excludeDescriptionArray && filterInternal.excludeDescriptionArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: filterInternal.excludeDescriptionArray,
				singularName: 'Description',
				midText: 'does not contain'
			})
		);
	}
	if (filterInternal.dateAfter) stringArray.push(`Date is after ${filterInternal.dateAfter}`);
	if (filterInternal.dateBefore) stringArray.push(`Date is before ${filterInternal.dateBefore}`);
	if (filterInternal.dateSpan) {
		const dateSpan = dateSpanInfo[filterInternal.dateSpan];
		stringArray.push(`Date is in ${dateSpan.title}`);
	}
	if (filterInternal.transfer !== undefined)
		stringArray.push(`Is ${filterInternal.transfer ? 'Transfer' : 'Not A Transfer'}`);
	if (filterInternal.complete !== undefined)
		stringArray.push(`Is ${filterInternal.complete ? 'Complete' : 'Incomplete'}`);
	if (filterInternal.linked !== undefined)
		stringArray.push(`Is ${filterInternal.linked ? 'Linked' : 'Not Linked'}`);
	if (filterInternal.dataChecked !== undefined)
		stringArray.push(
			filterInternal.dataChecked ? 'Has had data checked' : "Hasn't had data checked"
		);
	if (filterInternal.reconciled !== undefined)
		stringArray.push(filterInternal.reconciled ? 'Is Reconciled' : 'Is Not Reconciled');
	if (filterInternal.importIdArray && filterInternal.importIdArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: filterInternal.importIdArray,
				singularName: 'Import',
				inputToText: (title) => importIdsToTitles(db, title)
			})
		);
	if (filterInternal.importDetailIdArray && filterInternal.importDetailIdArray.length > 0)
		stringArray.push(
			await arrayToText({
				data: filterInternal.importDetailIdArray,
				singularName: 'Import Detail ID'
			})
		);

	const linkedArray: string[] = [];
	if (filterInternal.account) {
		linkedArray.push(
			...(await accountFilterToText({
				filter: filterInternal.account,
				prefix: 'Account',
				allText: false,
				db
			}))
		);
	}

	if (filterInternal.excludeAccount) {
		linkedArray.push(
			...(await accountFilterToText({
				filter: filterInternal.excludeAccount,
				prefix: 'Exclude Account',
				allText: false,
				db
			}))
		);
	}

	if (filterInternal.bill) {
		linkedArray.push(
			...(await billFilterToText({
				db,
				filter: filterInternal.bill,
				prefix: 'Bill',
				allText: false
			}))
		);
	}
	if (filterInternal.excludeBill) {
		linkedArray.push(
			...(await billFilterToText({
				db,
				filter: filterInternal.excludeBill,
				prefix: 'Exclude Bill',
				allText: false
			}))
		);
	}

	if (filterInternal.budget) {
		linkedArray.push(
			...(await budgetFilterToText({
				db,
				filter: filterInternal.budget,
				prefix: 'Budget',
				allText: false
			}))
		);
	}

	if (filterInternal.excludeBudget) {
		linkedArray.push(
			...(await budgetFilterToText({
				db,
				filter: filterInternal.excludeBudget,
				prefix: 'Exclude Budget',
				allText: false
			}))
		);
	}

	if (filterInternal.category) {
		linkedArray.push(
			...(await categoryFilterToText({
				db,
				filter: filterInternal.category,
				prefix: 'Category',
				allText: false
			}))
		);
	}
	if (filterInternal.excludeCategory) {
		linkedArray.push(
			...(await categoryFilterToText({
				db,
				filter: filterInternal.excludeCategory,
				prefix: 'Exclude Category',
				allText: false
			}))
		);
	}

	if (filterInternal.tag) {
		linkedArray.push(
			...(await tagFilterToText({ db, filter: filterInternal.tag, prefix: 'Tag', allText: false }))
		);
	}
	if (filterInternal.excludeTag) {
		linkedArray.push(
			...(await tagFilterToText({
				db,
				filter: filterInternal.excludeTag,
				prefix: 'Exclude Tag',
				allText: false
			}))
		);
	}

	if (filterInternal.label) {
		linkedArray.push(
			...(await labelFilterToText({
				db,
				filter: filterInternal.label,
				prefix: 'Label',
				allText: false
			}))
		);
	}

	if (filterInternal.excludeLabel) {
		linkedArray.push(
			...(await labelFilterToText({
				db,
				filter: filterInternal.excludeLabel,
				prefix: 'Exclude Label',
				allText: false
			}))
		);
	}

	if (filterInternal.payee?.id) {
		linkedArray.push(`Payee is ${await accountIdsToTitles(db, [filterInternal.payee.id])}`);
	}
	if (filterInternal.excludePayee?.id) {
		linkedArray.push(
			`Exclude Payee is ${await accountIdsToTitles(db, [filterInternal.excludePayee.id])}`
		);
	}

	if (filterInternal.payee?.title) {
		linkedArray.push(`Payee Title contains ${filterInternal.payee.title}`);
	}
	if (filterInternal.excludePayee?.title) {
		linkedArray.push(`Exclude Payee Title contains ${filterInternal.excludePayee.title}`);
	}

	if (filterInternal.payee?.idArray) {
		linkedArray.push(
			await arrayToText({
				data: filterInternal.payee.idArray,
				singularName: 'Payee',
				inputToText: (inputValue) => accountIdsToTitles(db, inputValue)
			})
		);
	}
	if (filterInternal.excludePayee?.idArray) {
		linkedArray.push(
			await arrayToText({
				data: filterInternal.excludePayee.idArray,
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
