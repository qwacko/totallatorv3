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
	const yearWeek = `${year}-W${String(Math.floor((dateObject.getDate() - 1) / 7) + 1).padStart(
		2,
		'0'
	)}`;
	const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
	const yearQuarter = `${year}-Q${String(Math.floor((month - 1) / 3) + 1).padStart(2, '0')}`;
	return { yearMonthDay, yearWeek, yearMonth, yearQuarter, year, date: dateObject, dateText: date };
};
