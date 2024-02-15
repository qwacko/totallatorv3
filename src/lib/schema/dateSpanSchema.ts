export const dateSpanEnum = [
	'thisWeek',
	'lastWeek',
	'thisMonth',
	'lastMonth',
	'thisQuarter',
	'lastQuarter',
	'thisYear',
	'lastYear',
	'thisFinancialYear',
	'lastFinancialYear',
	'fromOneMonthAgo',
	'fromThreeMonthsAgo',
	'fromSixMonthsAgo',
	'fromOneYearAgo',
	'fromTwoYearsAgo'
] as const;

export type DateSpanEnumType = (typeof dateSpanEnum)[number];

export const dateSpanInfo = {
	thisWeek: {
		id: 'thisWeek',
		title: 'This Week',
		getStartDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			const day = date.getDay();
			const diff = date.getDate() - day + (day == 0 ? -6 : 1);
			return new Date(date.setDate(diff));
		},
		getEndDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			const day = date.getDay();
			const diff = date.getDate() + (6 - day);
			return new Date(date.setDate(diff));
		}
	},
	lastWeek: {
		id: 'lastWeek',
		title: 'Last Week',
		getStartDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			const day = date.getDay();
			const diff = date.getDate() - day - 6;
			return new Date(date.setDate(diff));
		},
		getEndDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			const day = date.getDay();
			const diff = date.getDate() - day;
			return new Date(date.setDate(diff));
		}
	},
	thisMonth: {
		id: 'thisMonth',
		title: 'This Month',
		getStartDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			return new Date(date.getFullYear(), date.getMonth(), 1);
		},
		getEndDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			return new Date(date.getFullYear(), date.getMonth() + 1, 0);
		}
	},
	lastMonth: {
		id: 'lastMonth',
		title: 'Last Month',
		getStartDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			return new Date(date.getFullYear(), date.getMonth() - 1, 1);
		},
		getEndDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			return new Date(date.getFullYear(), date.getMonth(), 0);
		}
	},
	thisQuarter: {
		id: 'thisQuarter',
		title: 'This Quarter',
		getStartDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			const quarter = Math.floor(date.getMonth() / 3);
			return new Date(date.getFullYear(), quarter * 3, 1);
		},
		getEndDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			const quarter = Math.floor(date.getMonth() / 3);
			return new Date(date.getFullYear(), quarter * 3 + 3, 0);
		}
	},
	lastQuarter: {
		id: 'lastQuarter',
		title: 'Last Quarter',
		getStartDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			const quarter = Math.floor(date.getMonth() / 3) - 1;
			return new Date(date.getFullYear(), quarter * 3, 1);
		},
		getEndDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			const quarter = Math.floor(date.getMonth() / 3);
			return new Date(date.getFullYear(), quarter * 3, 0);
		}
	},
	thisYear: {
		id: 'thisYear',
		title: 'This Year',
		getStartDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			return new Date(date.getFullYear(), 0, 1);
		},
		getEndDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			return new Date(date.getFullYear(), 11, 31);
		}
	},
	lastYear: {
		id: 'lastYear',
		title: 'Last Year',
		getStartDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			return new Date(date.getFullYear() - 1, 0, 1);
		},
		getEndDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			return new Date(date.getFullYear() - 1, 11, 31);
		}
	},
	thisFinancialYear: {
		id: 'thisFinancialYear',
		title: 'This Financial Year',
		getStartDate: ({ currentDate, firstMonthOfFY }) => {
			const date = new Date(currentDate);
			const year = date.getMonth() >= firstMonthOfFY ? date.getFullYear() : date.getFullYear() - 1;
			return new Date(year, firstMonthOfFY, 1);
		},
		getEndDate: ({ currentDate, firstMonthOfFY }) => {
			const date = new Date(currentDate);
			const year = date.getMonth() >= firstMonthOfFY ? date.getFullYear() + 1 : date.getFullYear();
			return new Date(year, firstMonthOfFY, 0);
		}
	},
	lastFinancialYear: {
		id: 'lastFinancialYear',
		title: 'Last Financial Year',
		getStartDate: ({ currentDate, firstMonthOfFY }) => {
			const date = new Date(currentDate);
			const year =
				date.getMonth() >= firstMonthOfFY ? date.getFullYear() - 1 : date.getFullYear() - 2;
			return new Date(year, firstMonthOfFY, 1);
		},
		getEndDate: ({ currentDate, firstMonthOfFY }) => {
			const date = new Date(currentDate);
			const year = date.getMonth() >= firstMonthOfFY ? date.getFullYear() : date.getFullYear() - 1;
			return new Date(year, firstMonthOfFY, 0);
		}
	},
	fromOneMonthAgo: {
		id: 'fromOneMonthAgo',
		title: 'From 1 Month Ago',
		getStartDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			return new Date(date.setMonth(date.getMonth() - 1));
		},
		getEndDate: ({ currentDate }) => {
			return new Date(currentDate);
		}
	},
	fromThreeMonthsAgo: {
		id: 'fromThreeMonthsAgo',
		title: 'From 3 Months Ago',
		getStartDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			return new Date(date.setMonth(date.getMonth() - 3));
		},
		getEndDate: ({ currentDate }) => {
			return new Date(currentDate);
		}
	},
	fromSixMonthsAgo: {
		id: 'fromSixMonthsAgo',
		title: 'From 6 Months Ago',
		getStartDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			return new Date(date.setMonth(date.getMonth() - 6));
		},
		getEndDate: ({ currentDate }) => {
			return new Date(currentDate);
		}
	},
	fromOneYearAgo: {
		id: 'fromOneYearAgo',
		title: 'From 1 Year Ago',
		getStartDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			return new Date(date.setFullYear(date.getFullYear() - 1));
		},
		getEndDate: ({ currentDate }) => {
			return new Date(currentDate);
		}
	},
	fromTwoYearsAgo: {
		id: 'fromTwoYearsAgo',
		title: 'From 2 Years Ago',
		getStartDate: ({ currentDate }) => {
			const date = new Date(currentDate);
			return new Date(date.setFullYear(date.getFullYear() - 2));
		},
		getEndDate: ({ currentDate }) => {
			return new Date(currentDate);
		}
	}
} satisfies {
	[key in DateSpanEnumType]: {
		id: key;
		title: string;
		getStartDate: (data: { currentDate: Date; firstMonthOfFY: number }) => Date;
		getEndDate: (data: { currentDate: Date; firstMonthOfFY: number }) => Date;
	};
};

export const getDateSpanDropdown = () => {
	return dateSpanEnum.map((key) => ({
		value: key,
		name: dateSpanInfo[key].title
	}));
};
