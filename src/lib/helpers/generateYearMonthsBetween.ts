export function generateYearMonthsBetween(start: string, end: string): string[] {
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

	console.log('Year Months Between', result, { startDate, endDate });

	return result;
}

export function generateYearMonthsBeforeToday(numberMonths: number): string[] {
	const endDate = new Date();
	const startDate = new Date();
	startDate.setMonth(startDate.getMonth() - numberMonths + 1);

	return generateYearMonthsBetween(
		startDate.toISOString().slice(0, 7),
		endDate.toISOString().slice(0, 7)
	);
}
