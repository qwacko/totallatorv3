import { dateSpanInfo } from '@totallator/shared';
import type { JournalFilterSchemaWithoutPaginationType } from '@totallator/shared';

export type DBDateRangeType = {
	min: Date;
	max: Date;
};

export type DateRangeType = ReturnType<typeof filtersToDateRange>;

export const filtersToDateRange = (
	filters: JournalFilterSchemaWithoutPaginationType[],
	startingDateRange: DBDateRangeType
) => {
	const dateRange = filters.reduce(
		(acc, filter) => {
			if (filter.dateSpan) {
				const dateInformation = dateSpanInfo[filter.dateSpan];
				const startDate = dateInformation.getStartDate({
					currentDate: new Date(),
					firstMonthOfFY: 1
				});
				const endDate = dateInformation.getEndDate({
					currentDate: new Date(),
					firstMonthOfFY: 1
				});

				if (startDate > acc.start) {
					acc.start = startDate;
				}
				if (endDate < acc.end) {
					acc.end = endDate;
				}
			}

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
