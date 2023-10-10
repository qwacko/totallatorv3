import { generateYearMonthsBetween } from '$lib/helpers/generateYearMonthsBetween';

export type YearMonthSummaryType = { yearMonth: string; count: number; sum: number };

export function getMonthlySummary<T extends YearMonthSummaryType>({
	monthlyQuery,
	defaultValue,
	startDate,
	endDate
}: {
	monthlyQuery: T[];
	defaultValue: Omit<T, 'yearMonth'>;
	startDate: string | undefined;
	endDate: string | undefined;
}) {
	const yearMonths = monthlyQuery.map((item) => item.yearMonth);
	const startDateUse = startDate
		? startDate
		: yearMonths.reduce((prev, current) => (current < prev ? current : prev), '3000-00');
	const endDateUse = endDate
		? endDate
		: yearMonths.reduce((prev, current) => (current > prev ? current : prev), '0000-00');
	const monthList = generateYearMonthsBetween(startDateUse, endDateUse);

	const monthlySummary = monthList.map((currentMonth) => {
		const thisMonth = monthlyQuery.find((item) => item.yearMonth === currentMonth);

		const thisMonthUse = thisMonth ? thisMonth : { ...defaultValue, yearMonth: currentMonth };

		const runningTotal = monthlyQuery.reduce((prev, current) => {
			if (current.yearMonth <= currentMonth) {
				return prev + current.sum;
			}
			return prev;
		}, 0);
		const runningCount = monthlyQuery.reduce((prev, current) => {
			if (current.yearMonth <= currentMonth) {
				return prev + current.count;
			}
			return prev;
		}, 0);

		return {
			...thisMonthUse,
			runningTotal,
			runningCount
		};
	});
	return monthlySummary;
}
