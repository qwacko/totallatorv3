import { accountTypeEnum, type AccountTypeEnumType } from '$lib/schema/accountTypeSchema';
import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
import { dateRegex, isValidDate, monthRegex, textFilterHandler } from '../misc/processTextFilter';

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
		| 'account'
		| 'excludeAccount'
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
	{
		key: '!group:',
		update: (filter, newFilter) => {
			if (newFilter.length === 0) return;
			if (filter.excludeAccount === undefined) {
				filter.excludeAccount = {};
			}
			if (filter.excludeAccount.accountGroupCombinedArray === undefined) {
				filter.excludeAccount.accountGroupCombinedArray = [];
			}
			filter.excludeAccount.accountGroupCombinedArray.push(newFilter);
		}
	},
	{
		key: 'group:',
		update: (filter, newFilter) => {
			if (newFilter.length === 0) return;
			if (filter.account === undefined) {
				filter.account = {};
			}
			if (filter.account.accountGroupCombinedArray === undefined) {
				filter.account.accountGroupCombinedArray = [];
			}
			filter.account.accountGroupCombinedArray.push(newFilter);
		}
	},
	{
		key: 'networth:',
		update: (filter) => {
			if (filter.account === undefined) {
				filter.account = {};
			}
			filter.account.isNetWorth = true;
		}
	},
	{
		key: '!networth:',
		update: (filter) => {
			if (filter.account === undefined) {
				filter.account = {};
			}
			filter.account.isNetWorth = false;
		}
	},
	{
		key: 'cash:',
		update: (filter) => {
			if (filter.account === undefined) {
				filter.account = {};
			}
			filter.account.isCash = true;
		}
	},
	{
		key: '!cash:',
		update: (filter) => {
			if (filter.account === undefined) {
				filter.account = {};
			}
			filter.account.isCash = false;
		}
	},
	{
		key: '!type:',
		update: (filter, newFilter) => {
			if (newFilter.length === 0) return;

			const splitFilter = newFilter.trim().replace('|', ',').split(',');

			for (const currentFilter of splitFilter) {
				const accountType = currentFilter.trim().toLocaleLowerCase() as AccountTypeEnumType;

				if (accountTypeEnum.includes(accountType)) {
					if (filter.excludeAccount === undefined) {
						filter.excludeAccount = {};
					}
					if (filter.excludeAccount.type === undefined) {
						filter.excludeAccount.type = [];
					}
					filter?.excludeAccount?.type && filter.excludeAccount.type.push(accountType);
				}
			}
		}
	},
	{
		key: 'type:',
		update: (filter, newFilter) => {
			if (newFilter.length === 0) return;

			const splitFilter = newFilter.trim().replace('|', ',').split(',');

			for (const currentFilter of splitFilter) {
				const accountType = currentFilter.trim() as AccountTypeEnumType;

				if (accountTypeEnum.includes(accountType)) {
					if (filter.account === undefined) {
						filter.account = {};
					}
					if (filter.account.type === undefined) {
						filter.account.type = [];
					}
					filter?.account?.type && filter.account.type.push(accountType);
				}
			}
		}
	},
	handleNested('!payee:', 'excludePayee'),
	handleNested('!label:', 'excludeLabel'),
	handleNested('!tag:', 'excludeTag'),
	handleNested('!account:', 'excludeAccount'),
	handleNested('!category:', 'excludeCategory'),
	handleNested('!bill:', 'excludeBill'),
	handleNested('!budget:', 'excludeBudget'),
	handleNested('label:', 'label'),
	handleNested('payee:', 'payee'),
	handleNested('tag:', 'tag'),
	handleNested('account:', 'account'),
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
			if (newFilter.length === 0) return;
			if (!filter.descriptionArray) {
				filter.descriptionArray = [];
			}

			filter.descriptionArray.push(newFilter);
		}
	},
	{
		key: '!description:',
		update: (filter, newFilter) => {
			if (newFilter.length === 0) return;
			if (!filter.excludeDescriptionArray) {
				filter.excludeDescriptionArray = [];
			}
			filter.excludeDescriptionArray.push(newFilter);
		}
	},
	{
		key: '!',
		update: (filter, newFilter) => {
			if (newFilter.length === 0) return;
			if (!filter.excludeDescriptionArray) {
				filter.excludeDescriptionArray = [];
			}
			filter.excludeDescriptionArray.push(newFilter);
		}
	}
] satisfies {
	key: string;
	update: (filter: JournalFilterSchemaWithoutPaginationType, currentFilter: string) => void;
}[];

export const processJournalTextFilter = textFilterHandler(filterArray, (filter, currentFilter) => {
	if (currentFilter.length === 0) return;
	if (!filter.descriptionArray) {
		filter.descriptionArray = [];
	}

	filter.descriptionArray.push(currentFilter);
});
