import { generateYearMonthsBetween } from '$lib/helpers/generateYearMonthsBetween';
import type { MonthlySummarySchemaType } from '$lib/schema/summaryCacheSchema';

export function getMonthlySummary({
	monthlyQuery,
	defaultValue,
	startDate,
	endDate
}: {
	monthlyQuery: Omit<MonthlySummarySchemaType, 'runningTotal' | 'runningCount'>[];
	defaultValue: Omit<MonthlySummarySchemaType, 'yearMonth'>;
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
