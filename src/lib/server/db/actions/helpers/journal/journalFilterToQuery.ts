import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
import { accountFilterToText, accountIdsToTitles } from '../account/accountFilterToQuery';
import { billFilterToText } from '../bill/billFilterToQuery';
import { budgetFilterToText } from '../budget/budgetFilterToQuery';
import { tagFilterToText } from '../tag/tagFilterToQuery';
import { categoryFilterToText } from '../category/categoryFilterToQuery';
import { labelFilterToText } from '../label/labelFilterToQuery';
import { type DBType } from '../../../db';
import { arrayToText } from '../misc/arrayToText';
import { importIdsToTitles } from '../import/importIdsToTitles';
import { dateSpanInfo } from '$lib/schema/dateSpanSchema';
import { processJournalTextFilter } from './processJournalTextFilter';
import { linkedFileFilterToText } from '../file/fileFilterToQuery';
import { linkedNoteFilterToText } from '../note/noteFilterToQuery';
import { llmReviewStatusEnumTitles } from '../../../../../../schema/llmReviewStatusEnum';

export const journalFilterToText = async ({
	filter,
	prefix,
	allText = true,
	db
}: {
	filter: JournalFilterSchemaWithoutPaginationType;
	prefix?: string;
	allText?: boolean;
	db: DBType;
}) => {
	const filterInternal = processJournalTextFilter.process(JSON.parse(JSON.stringify(filter)));

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
	if (filterInternal.llmReviewStatus && filterInternal.llmReviewStatus.length > 0) {
		const statusNames = filterInternal.llmReviewStatus.map((status) => llmReviewStatusEnumTitles[status]);
		stringArray.push(`LLM Review Status is ${statusNames.join(', ')}`);
	}
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

	if (filterInternal.note !== undefined) {
		if (filterInternal.note) {
			stringArray.push('Note Exists');
		} else {
			stringArray.push('Note Does Not Exist');
		}
	}
	if (filterInternal.reminder !== undefined) {
		if (filterInternal.reminder) {
			stringArray.push('Reminder Note Exists');
		} else {
			stringArray.push('Reminder Not Does Not Exist');
		}
	}

	linkedFileFilterToText(filterInternal, stringArray);
	linkedNoteFilterToText(filterInternal, stringArray);

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

	if (filterInternal.payee?.titleArray) {
		linkedArray.push(
			await arrayToText({
				data: filterInternal.payee.titleArray,
				singularName: 'Payee Title',
				midText: 'contains'
			})
		);
	}

	if (filterInternal.excludePayee?.titleArray) {
		linkedArray.push(
			await arrayToText({
				data: filterInternal.excludePayee.titleArray,
				singularName: 'Exclude Payee Title',
				midText: 'contains'
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
