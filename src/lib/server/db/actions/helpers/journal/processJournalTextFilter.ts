import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
import { llmReviewStatusEnum, type LlmReviewStatusEnumType } from '../../../../../../schema/llmReviewStatusEnum';
import { accountTextFilterKeys } from '../account/accountTextFilter';
import { billTextFilterKeys } from '../bill/billTextFilter';
import { budgetTextFilterKeys } from '../budget/budgetTextFilter';
import { categoryTextFilterKeys } from '../category/categoryTextFilter';
import { fileFilterArray } from '../file/fileTextFilter';
import { labelTextFilterKeys } from '../label/labelTextFilter';
import {
	addToArray,
	dateRegex,
	isValidDate,
	monthRegex,
	nestedStringFilterHandler,
	textFilterHandler,
	type TextFilterOptionsType
} from '../misc/processTextFilter';
import { noteFilterArray } from '../note/noteTextFilter';
import { tagTextFilterKeys } from '../tag/tagTextFilter';

const handleNested = <U extends 'payee' | 'excludePayee'>(search: string, key: U) => ({
	key: search,
	update: (filter: JournalFilterSchemaWithoutPaginationType, newFilter: string) => {
		if (newFilter.length === 0) return;
		if (filter[key] === undefined) {
			// Use a type assertion here to convince TypeScript that this assignment is safe.
			filter[key] = {};
		}
		if (filter[key]?.titleArray === undefined) {
			filter[key]!.titleArray = [];
		}
		filter[key]?.titleArray?.push(newFilter);
	}
});

const filterArray = [
	nestedStringFilterHandler<'excludeAccount', JournalFilterSchemaWithoutPaginationType>(
		accountTextFilterKeys,
		'!account',
		'excludeAccount'
	),
	nestedStringFilterHandler<'account', JournalFilterSchemaWithoutPaginationType>(
		accountTextFilterKeys,
		'account',
		'account'
	),
	nestedStringFilterHandler<'excludeLabel', JournalFilterSchemaWithoutPaginationType>(
		labelTextFilterKeys,
		'!label',
		'excludeLabel'
	),
	nestedStringFilterHandler<'label', JournalFilterSchemaWithoutPaginationType>(
		labelTextFilterKeys,
		'label',
		'label'
	),
	nestedStringFilterHandler<'excludeTag', JournalFilterSchemaWithoutPaginationType>(
		tagTextFilterKeys,
		'!tag',
		'excludeTag'
	),
	nestedStringFilterHandler<'tag', JournalFilterSchemaWithoutPaginationType>(
		tagTextFilterKeys,
		'tag',
		'tag'
	),
	nestedStringFilterHandler<'excludeCategory', JournalFilterSchemaWithoutPaginationType>(
		categoryTextFilterKeys,
		'!category',
		'excludeCategory'
	),
	nestedStringFilterHandler<'category', JournalFilterSchemaWithoutPaginationType>(
		categoryTextFilterKeys,
		'category',
		'category'
	),
	nestedStringFilterHandler<'excludeBill', JournalFilterSchemaWithoutPaginationType>(
		billTextFilterKeys,
		'!bill',
		'excludeBill'
	),
	nestedStringFilterHandler<'bill', JournalFilterSchemaWithoutPaginationType>(
		billTextFilterKeys,
		'bill',
		'bill'
	),
	nestedStringFilterHandler<'excludeBudget', JournalFilterSchemaWithoutPaginationType>(
		budgetTextFilterKeys,
		'!budget',
		'excludeBudget'
	),
	nestedStringFilterHandler<'budget', JournalFilterSchemaWithoutPaginationType>(
		budgetTextFilterKeys,
		'budget',
		'budget'
	),
	handleNested('!payee:', 'excludePayee'),
	handleNested('payee:', 'payee'),
	{
		key: 'month:',
		update: (filter, newFilter) => {
			const dateMatch = newFilter.match(monthRegex);

			if (dateMatch) {
				const validDate = isValidDate(dateMatch[1], dateMatch[2], '1');
				if (validDate) {
					if (!filter.yearMonth) {
						filter.yearMonth = [];
					}
					filter.yearMonth.push(validDate.slice(0, 7));
				}
			}
		}
	},
	{
		key: '!month:',
		update: (filter, newFilter) => {
			const dateMatch = newFilter.match(monthRegex);

			if (dateMatch) {
				const validDate = isValidDate(dateMatch[1], dateMatch[2], '1');
				if (validDate) {
					if (!filter.excludeYearMonth) {
						filter.excludeYearMonth = [];
					}
					filter.excludeYearMonth.push(validDate.slice(0, 7));
				}
			}
		}
	},
	{
		key: 'before:',
		update: (filter, newFilter) => {
			const dateMatch = newFilter.match(dateRegex);

			if (dateMatch) {
				const validDate = isValidDate(dateMatch[1], dateMatch[2], dateMatch[3]);
				if (validDate) {
					filter.dateBefore = validDate;
				}
			}
		}
	},
	{
		key: 'after:',
		update: (filter, newFilter) => {
			const dateMatch = newFilter.match(dateRegex);

			if (dateMatch) {
				const validDate = isValidDate(dateMatch[1], dateMatch[2], dateMatch[3]);
				if (validDate) {
					filter.dateAfter = validDate;
				}
			}
		}
	},
	{
		key: 'transfer:',
		update: (filter) => {
			filter.transfer = true;
		}
	},
	{
		key: '!transfer',
		update: (filter) => {
			filter.transfer = false;
		}
	},
	{
		key: 'checked:',
		update: (filter) => {
			filter.dataChecked = true;
		}
	},
	{
		key: '!checked:',
		update: (filter) => {
			filter.dataChecked = false;
		}
	},
	{
		key: 'reconciled:',
		update: (filter) => {
			filter.reconciled = true;
		}
	},
	{
		key: '!reconciled:',
		update: (filter) => {
			filter.reconciled = false;
		}
	},
	{
		key: 'complete:',
		update: (filter) => {
			filter.complete = true;
		}
	},
	{
		key: '!complete',
		update: (filter) => {
			filter.complete = false;
		}
	},
	{
		key: 'llm:',
		update: (filter, newFilter) => {
			if (newFilter.length === 0) return;

			const splitFilter = newFilter.trim().replace('|', ',').split(',');

			for (const currentFilter of splitFilter) {
				const llmStatus = currentFilter.trim().toLowerCase() as LlmReviewStatusEnumType;

				if (llmReviewStatusEnum.includes(llmStatus)) {
					if (filter.llmReviewStatus === undefined) {
						filter.llmReviewStatus = [];
					}
					filter.llmReviewStatus.push(llmStatus);
				}
			}
		}
	},
	{
		key: 'linked:',
		update: (filter) => {
			filter.linked = true;
		}
	},
	{
		key: '!linked:',
		update: (filter) => {
			filter.linked = false;
		}
	},
	{
		key: 'max:',
		update: (filter, newFilter) => {
			if (newFilter.length === 0) return;
			const newMaxPre = parseFloat(newFilter);

			const newMax = isNaN(newMaxPre) ? 0 : newMaxPre;
			if (filter.maxAmount === undefined) filter.maxAmount = newMax;
			else {
				filter.maxAmount = Math.max(filter.maxAmount, newMax);
			}
		}
	},
	{
		key: 'min:',
		update: (filter, newFilter) => {
			if (newFilter.length === 0) return;
			const newMinPre = parseFloat(newFilter);
			const newMin = isNaN(newMinPre) ? 0 : newMinPre;
			if (filter.minAmount === undefined) filter.minAmount = newMin;
			else {
				filter.minAmount = Math.min(filter.minAmount, newMin);
			}
		}
	},
	{
		key: ['description:', 'desc:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'descriptionArray', newFilter);
		}
	},
	{
		key: ['!description:', '!desc:'],
		update: (filter, newFilter) => {
			addToArray(filter, 'excludeDescriptionArray', newFilter);
		}
	},
	...fileFilterArray,
	...noteFilterArray
] satisfies TextFilterOptionsType<JournalFilterSchemaWithoutPaginationType>;

export { filterArray as journalFilterArray };

export const processJournalTextFilter = textFilterHandler(
	filterArray,
	(filter, currentFilter) => {
		addToArray(filter, 'descriptionArray', currentFilter);
	},
	(filter, currentFilter) => {
		addToArray(filter, 'excludeDescriptionArray', currentFilter);
	},
	{
		'cash:': 'accountcash:',
		'!cash:': 'account!cash:',
		'type:': 'accounttype:',
		'!type:': 'account!type:',
		'networth:': 'accountnetworth:',
		'!networth:': 'account!networth:',
		'nw:': 'accountnetworth:',
		'!nw': 'account!networth:'
	}
);
