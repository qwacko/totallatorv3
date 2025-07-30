import { expandDate } from '@/actions/helpers/journal/expandDate';
import { filterNullUndefinedAndDuplicates } from './filterNullUndefinedAndDuplicates';

export const generateDateItemsBetween = ({
	startDate,
	endDate,
	timeUnit
}: {
	startDate: string;
	endDate: string;
	timeUnit: 'month' | 'day' | 'year' | 'week' | 'quarter';
}): string[] => {
	const startDateObject = new Date(startDate);
	const endDateObject = new Date(endDate);

	if (startDateObject > endDateObject) {
		return [];
	}

	const result: string[] = [];

	const timeStep =
		timeUnit === 'week'
			? 7
			: timeUnit === 'day'
				? 1
				: timeUnit === 'quarter'
					? 3 * 4 * 7
					: timeUnit === 'month'
						? 27
						: timeUnit === 'year'
							? 365
							: 365;

	while (startDateObject <= endDateObject) {
		result.push(getDateInfoForDate({ date: startDateObject.toISOString().slice(0, 10), timeUnit }));

		startDateObject.setDate(startDateObject.getDate() + timeStep);
	}

	result.push(getDateInfoForDate({ date: endDateObject.toISOString().slice(0, 10), timeUnit }));

	return filterNullUndefinedAndDuplicates(result);
};

const getDateInfoForDate = ({
	date,
	timeUnit
}: {
	date: string;
	timeUnit: 'month' | 'day' | 'year' | 'week' | 'quarter';
}) => {
	const dateInformation = expandDate(date);

	if (timeUnit === 'week') {
		return dateInformation.yearWeek;
	} else if (timeUnit === 'day') {
		return dateInformation.yearMonthDay;
	} else if (timeUnit === 'quarter') {
		return dateInformation.yearQuarter;
	} else if (timeUnit === 'month') {
		return dateInformation.yearMonth;
	} else if (timeUnit === 'year') {
		return dateInformation.year;
	}

	return 'error';
};
