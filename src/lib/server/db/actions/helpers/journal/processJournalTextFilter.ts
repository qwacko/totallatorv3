import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';

function splitInput(inputString: string): string[] {
	// Regular expression to match quoted strings, xxx: prefixed words (possibly quoted),
	// and any sequence of non-whitespace characters as fallback.
	const pattern = /\b\w+:"[^"]*"|\b\w+:[^\s]*|"[^"]*"|\S+/g;

	// Find all matches in the input string according to the pattern
	const matches = inputString.match(pattern);

	// Process the matches to clean up the output, such as trimming unwanted characters
	const processedMatches =
		matches?.map((match) => {
			// Keep quotes only for tag:"..." or similar patterns, remove them otherwise
			if (match.startsWith('tag:')) {
				return match;
			} else {
				return match.replace(/^"|"$/g, ''); // Remove surrounding quotes
			}
		}) || [];

	return processedMatches;
}

const unpackText = (inputText: string, excludeStart: string | undefined): string => {
	let internalText = inputText;

	if (excludeStart && inputText.startsWith(excludeStart)) {
		internalText = inputText.slice(excludeStart.length);
	}

	internalText = internalText.trim();

	if (internalText.startsWith('"') && internalText.endsWith('"')) {
		internalText = internalText.slice(1, -1);

		//This is necessary, as the regex already trims off the end quote
	} else if (internalText.startsWith('"')) {
		internalText = internalText.slice(1);
	}

	return internalText;
};

export const processJournalTextFilter = (
	filter: JournalFilterSchemaWithoutPaginationType
): JournalFilterSchemaWithoutPaginationType => {
	if (!filter.textFilter) {
		return filter;
	}

	const processedTextFilter = splitInput(filter.textFilter);

	for (const text of processedTextFilter) {
		if (text.startsWith('description:')) {
			const currentFilter = unpackText(text, 'description:');
			filter.descriptionArray = filter.descriptionArray || [];
			filter.descriptionArray.push(currentFilter);
		} else {
			filter.descriptionArray = filter.descriptionArray || [];
			filter.descriptionArray.push(text);
		}
	}

	return { ...filter, textFilter: undefined };
};
