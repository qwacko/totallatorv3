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

export const textFilterHandler =
	<T extends { textFilter?: string }>(
		filterList: {
			key: string;
			update: (filter: T, currentFilter: string) => void;
		}[],
		defaultFilter: (filter: T, currentFilter: string) => void
	) =>
	(filter: T, logProcessing?: boolean) => {
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

			for (const currentFilterInfo in filterList) {
				const currentFilter = filterList[currentFilterInfo];
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
				defaultFilter(filter, currentFilter);
			}

			if (logProcessing) {
				console.log(`Text "${text}" handled by filter "${filterKey}"`);
			}
		}

		return { ...filter, textFilter: undefined };
	};
