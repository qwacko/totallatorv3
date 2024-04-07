import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
import { accountTextFilterKeys } from '../account/accountTextFilter';
import {
	addToArray,
	dateRegex,
	isValidDate,
	monthRegex,
	nestedStringFilterHandler,
	textFilterHandler,
	type TextFilterOptionsType
} from '../misc/processTextFilter';

const handleNested = <
	U extends
		| 'tag'
		| 'excludeTag'
		| 'bill'
		| 'excludeBill'
		| 'budget'
		| 'excludeBudget'
		| 'category'
		| 'excludeCategory'
		| 'label'
		| 'excludeLabel'
		| 'payee'
		| 'excludePayee'
>(
	search: string,
	key: U
) => ({
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
	handleNested('!payee:', 'excludePayee'),
	handleNested('!label:', 'excludeLabel'),
	handleNested('!tag:', 'excludeTag'),
	handleNested('!category:', 'excludeCategory'),
	handleNested('!bill:', 'excludeBill'),
	handleNested('!budget:', 'excludeBudget'),
	handleNested('label:', 'label'),
	handleNested('payee:', 'payee'),
	handleNested('tag:', 'tag'),
	handleNested('category:', 'category'),
	handleNested('bill:', 'bill'),
	handleNested('budget:', 'budget'),
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
		key: 'description:',
		update: (filter, newFilter) => {
			addToArray(filter, 'descriptionArray', newFilter);
		}
	},
	{
		key: '!description:',
		update: (filter, newFilter) => {
			addToArray(filter, 'excludeDescriptionArray', newFilter);
		}
	}
] satisfies TextFilterOptionsType<JournalFilterSchemaWithoutPaginationType>;

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
