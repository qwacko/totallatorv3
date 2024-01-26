import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';

export const filtersToDateRange = (filters: JournalFilterSchemaWithoutPaginationType[]) => {
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
			start: new Date('1000-01-01'),
			end: new Date('3000-01-01')
		}
	);

	return dateRange;
};
