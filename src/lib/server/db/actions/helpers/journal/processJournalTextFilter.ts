import { accountTypeEnum, type AccountTypeEnumType } from '$lib/schema/accountTypeSchema';
import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';

function splitInput(inputString: string): string[] {
	const pattern = /\S+:"[^"]*"\s|\S+:\S+\s|("|!")[^"]*"\s|\S+/g;

	// Find all matches in the input string according to the pattern
	// Adds a space at the end to ensure the last match is not missed
	const matches = `${inputString} `.match(pattern);

	// Process the matches to clean up the output, such as trimming unwanted characters
	const processedMatches =
		matches?.map((match) => {
			return match.trim();
		}) || [];

	return processedMatches;
}

const unpackText = (inputText: string, excludeStart?: string | undefined): string => {
	let internalText = inputText;

	if (excludeStart && inputText.toLocaleLowerCase().startsWith(excludeStart.toLocaleLowerCase())) {
		internalText = inputText.slice(excludeStart.length);
	}

	internalText = internalText.trim();

	if (internalText.startsWith('"') && internalText.endsWith('"')) {
		internalText = internalText.slice(1, -1);
	}

	return internalText;
};

const dateRegex = /(\d{2,4})-(\d{1,2})-(\d{1,2})/;
const monthRegex = /(\d{2,4})-(\d{1,2})/;

function isValidDate(year: string, month: string, day: string) {
	const intYearPre = parseInt(year);
	const intYear = intYearPre < 1000 ? 2000 + intYearPre : intYearPre;
	const intMonth = parseInt(month);
	const intDay = parseInt(day);

	// JavaScript's Date month is 0-indexed, so subtract 1 from the month
	let date = new Date(intYear, intMonth - 1, intDay);

	// Check if the year, month, and day match up after the Date correction
	const match =
		date.getFullYear() === intYear && date.getMonth() === intMonth - 1 && date.getDate() === intDay;

	if (!match) {
		return undefined;
	}

	const stringYear = intYear < 1000 ? `20${intYear}` : intYear.toString();
	const stringMonth = intMonth < 10 ? `0${intMonth}` : intMonth.toString();
	const stringDay = intDay < 10 ? `0${intDay}` : intDay.toString();

	return `${stringYear}-${stringMonth}-${stringDay}`;
}

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

export const processJournalTextFilter = (
	filter: JournalFilterSchemaWithoutPaginationType,
	logProcessing?: boolean
): JournalFilterSchemaWithoutPaginationType => {
	if (!filter.textFilter) {
		return filter;
	}

	const processedTextFilter = splitInput(filter.textFilter);

	if (logProcessing) {
		console.log('processedTextFilter:', filter.textFilter, processedTextFilter);
	}

	for (const text of processedTextFilter) {
		let filterHandled = false;
		let filterKey = '';

		for (const currentFilterInfo in filterArray) {
			const currentFilter = filterArray[currentFilterInfo];
			if (text.toLocaleLowerCase().startsWith(currentFilter.key.toLocaleLowerCase())) {
				filterKey = currentFilter.key;
				filterHandled = true;
				currentFilter.update(filter, unpackText(text, currentFilter.key));
				break;
			}
		}
		if (!filterHandled) {
			filterKey = 'default';
			const currentFilter = unpackText(text);
			filter.descriptionArray = filter.descriptionArray || [];
			filter.descriptionArray.push(currentFilter);
		}

		if (logProcessing) {
			console.log(`Text "${text}" handled by filter "${filterKey}"`);
		}
	}

	return { ...filter, textFilter: undefined };
};
