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
	const yearWeek = `${getWeekYear(dateObject)}-W${String(getWeek(dateObject)).padStart(2, '0')}`;
	const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
	const yearQuarter = `${year}-Q${String(Math.floor((month - 1) / 3) + 1).padStart(2, '0')}`;
	return { yearMonthDay, yearWeek, yearMonth, yearQuarter, year, date: dateObject, dateText: date };
};

const getWeek = function (dateIn: Date) {
	let date = new Date(dateIn);
	date.setHours(0, 0, 0, 0);
	// Thursday in current week decides the year.
	date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
	// January 4 is always in week 1.
	var week1 = new Date(date.getFullYear(), 0, 4);
	// Adjust to Thursday in week 1 and count number of weeks from date to week1.
	return (
		1 +
		Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
	);
};

// Returns the four-digit year corresponding to the ISO week of the date.
const getWeekYear = function (dateIn: Date) {
	let date = new Date(dateIn);
	date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
	return date.getFullYear();
};
