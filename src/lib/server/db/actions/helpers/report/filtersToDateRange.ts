import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';

export type DBDateRangeType = {
	min: Date;
	max: Date;
};

export const filtersToDateRange = (
	filters: JournalFilterSchemaWithoutPaginationType[],
	startingDateRange: DBDateRangeType
) => {
	const dateRange = filters.reduce(
		(acc, filter) => {
			if (filter.dateAfter && new Date(filter.dateAfter) > acc.start) {
				acc.start = new Date(filter.dateAfter);
			}
			if (filter.dateBefore && new Date(filter.dateBefore) < acc.end) {
				acc.end = new Date(filter.dateBefore);
			}
			return acc;
		},
		{
			start: startingDateRange.min,
			end: new Date()
		}
	);

	return dateRange;
};
