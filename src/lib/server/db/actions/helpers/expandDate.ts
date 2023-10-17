export const expandDate = (
	date: string
): {
	yearMonthDay: string;
	yearWeek: string;
	yearMonth: string;
	yearQuarter: string;
	year: string;
	date: Date;
	dateText: string;
} => {
	const dateObject = new Date(date);
	const year = String(dateObject.getFullYear());
	const month = dateObject.getMonth() + 1;
	const day = dateObject.getDate();
	const yearMonthDay = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
	const yearWeek = `${dateObject.getFullYear()}-W${String(getWeekNumber(dateObject)).padStart(
		2,
		'0'
	)}`;
	const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
	const yearQuarter = `${year}-Q${String(Math.floor((month - 1) / 3) + 1).padStart(2, '0')}`;
	return { yearMonthDay, yearWeek, yearMonth, yearQuarter, year, date: dateObject, dateText: date };
};
const getWeekNumber = (dateObject: Date): number => {
	// startDay: 0 (Sunday) to 6 (Saturday)
	const startDay = 0;

	// Get the first day of the year
	const startOfYear = new Date(dateObject.getFullYear(), 0, 1);

	// Calculate the difference in days
	const daysPassed = Math.floor(
		(dateObject.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
	);

	// Adjust for the chosen start day of the week
	const dayOfYear = startOfYear.getDay();
	let adjustment = startDay - dayOfYear;
	if (adjustment < 0) {
		adjustment += 7;
	}

	// Return the week number
	return Math.ceil((daysPassed + adjustment + 1) / 7);
};
