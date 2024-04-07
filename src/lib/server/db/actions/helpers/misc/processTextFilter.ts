export const addToArray = <T extends Record<string, string[] | any>>(
	filter: T,
	key: keyof T,
	value: string
) => {
	if (value.length === 0) return;
	if (!filter[key]) {
		filter[key] = [] as any;
	}
	filter[key].push(value);
};

export const compareTextNumber = <T extends Record<string, number | undefined | any>>(
	filter: T,
	key: keyof T,
	currentFilter: string,
	type: 'min' | 'max'
) => {
	const numberMatch = parseFloat(currentFilter);

	if (!isNaN(numberMatch)) {
		const currentFilterNumber = filter[key];

		if (typeof currentFilterNumber === 'number') {
			if (type === 'min') {
				filter[key] = Math.min(currentFilterNumber, numberMatch) as T[keyof T];
			} else {
				filter[key] = Math.max(currentFilterNumber, numberMatch) as T[keyof T];
			}
		} else {
			filter[key] = numberMatch as T[keyof T]; // Update type constraint to allow for undefined values
		}
	}
};

export const compareTextDate = <T extends Record<string, string | undefined | any>>(
	filter: T,
	key: keyof T,
	currentFilter: string,
	type: 'min' | 'max'
) => {
	const dateMatch = currentFilter.match(dateRegex);

	if (dateMatch) {
		const [, year, month, day] = dateMatch;
		const date = isValidDate(year, month, day);

		if (date) {
			const currentFilterDate = filter[key];

			if (typeof currentFilterDate === 'string') {
				const currentFilterDateString = currentFilterDate as string;
				if (type === 'min') {
					filter[key] = (
						currentFilterDateString < date ? currentFilterDateString : date
					) as T[keyof T];
				} else {
					filter[key] = (
						currentFilterDateString > date ? currentFilterDateString : date
					) as T[keyof T];
				}
			} else {
				filter[key] = date as T[keyof T]; // Update type constraint to allow for undefined values
			}
		}
	}
};

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

export const dateRegex = /(\d{2,4})-(\d{1,2})-(\d{1,2})/;
export const monthRegex = /(\d{2,4})-(\d{1,2})/;
export const yearRegex = /(\d{2,4})/;

export function isValidDate(year: string, month: string, day: string) {
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

export type TextFilterOptionsType<T extends { textFilter?: string }> = {
	key: string | string[];
	update: (filter: T, currentFilter: string, prefix: string) => void;
}[];

export const textFilterHandler = <T extends { textFilter?: string }>(
	filterList: TextFilterOptionsType<T>,
	defaultFilter: (filter: T, currentFilter: string) => void,
	defaultExcludeFilter: (filter: T, currentFilter: string) => void,
	proxyKeys?: { [U: string]: string }
) => {
	const process = (extFilter: T, logProcessing?: boolean) => {
		const filter = JSON.parse(JSON.stringify(extFilter)) as T;
		if (!filter.textFilter) {
			return filter;
		}

		const processedTextFilter = splitInput(filter.textFilter);

		if (logProcessing) {
			console.log('processedTextFilter:', filter.textFilter, processedTextFilter);
		}

		for (const text of processedTextFilter) {
			let useText = text;
			if (proxyKeys) {
				for (const proxyKey in proxyKeys) {
					if (text.toLocaleLowerCase().startsWith(proxyKey.toLocaleLowerCase())) {
						useText = `${proxyKeys[proxyKey]}${text.slice(proxyKey.length)}`;
						break;
					}
				}
			}
			if (logProcessing && useText !== text) {
				console.log(`Text "${text}" proxied to "${useText}"`);
			}
			let filterHandled = false;
			let filterKey = '';

			for (const currentFilterInfo in filterList) {
				if (filterHandled) {
					break;
				}
				const currentFilter = filterList[currentFilterInfo];
				const currentFilterKeyAsArray = Array.isArray(currentFilter.key)
					? currentFilter.key
					: [currentFilter.key];
				for (const currentFilterKey of currentFilterKeyAsArray) {
					if (filterHandled) {
						break;
					}

					if (useText.toLocaleLowerCase().startsWith(currentFilterKey.toLocaleLowerCase())) {
						filterKey = currentFilterKey;
						filterHandled = true;
						currentFilter.update(filter, unpackText(useText, currentFilterKey), filterKey);
						break;
					}
				}
			}
			if (!filterHandled) {
				if (useText.startsWith('!')) {
					filterKey = 'default exclude';
					const currentFilter = unpackText(useText, '!');
					defaultExcludeFilter(filter, currentFilter);
				} else {
					filterKey = 'default';
					const currentFilter = unpackText(useText);
					defaultFilter(filter, currentFilter);
				}
			}

			if (logProcessing) {
				console.log(`Text "${text}" handled by filter "${filterKey}"`);
			}
		}

		return { ...filter, textFilter: undefined };
	};

	const keys = () =>
		[...(proxyKeys ? Object.keys(proxyKeys) : []), ...filterList.map((item) => item.key)]
			.flat()
			.sort();

	return { process, keys };
};

type WithTextFilter = { textFilter?: string | undefined };

// This helper type ensures that T has a structure where it can contain any number of keys of type string,
// and at least one of those keys (specified by U) points to an object of type WithTextFilter.
type FilterType<U extends PropertyKey> = { [K in U]?: WithTextFilter } & Record<string, any>;

export const nestedStringFilterHandler = <U extends string, T extends FilterType<U>>(
	filterKeys: string[],
	filterPrefix: string,
	filterKey: U
): TextFilterOptionsType<T>[number] => {
	return {
		key: [
			...filterKeys.map((item) => `${filterPrefix}${item}`),
			`${filterPrefix}:`,
			`!${filterPrefix}:`
		],
		update: (filter: T, currentFilter: string, currentPrefix: string) => {
			if (!filter[filterKey]) {
				filter[filterKey] = {} as T[U];
			}
			if (!filter[filterKey].textFilter) {
				filter[filterKey].textFilter = '';
			}

			const filterUse = currentPrefix.slice(filterPrefix.length);

			filter[filterKey].textFilter += ` ${filterUse === ':' ? '' : filterUse}"${currentFilter}"`;
		}
	};
};
