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

function generateYearMonthsBetween(start: string, end: string): string[] {
	const startDate = new Date(`${start}-01`); // Convert "year-month" to a full date format
	const endDate = new Date(`${end}-01`);

	const result: string[] = [];

	while (startDate <= endDate) {
		const year = startDate.getFullYear();
		const month = startDate.getMonth() + 1; // Months are 0-indexed in JavaScript
		const yearMonth = `${year}-${month.toString().padStart(2, '0')}`; // Ensure month is two digits
		result.push(yearMonth);

		// Move to the next month
		startDate.setMonth(startDate.getMonth() + 1);
	}

	return result;
}
