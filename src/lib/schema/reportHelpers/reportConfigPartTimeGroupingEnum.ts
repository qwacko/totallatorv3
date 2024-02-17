export const reportConfigPartTimeGroupingEnum = ['year', 'month', 'quarter', 'week'] as const;
export type ReportConfigPartTimeGroupingType = (typeof reportConfigPartTimeGroupingEnum)[number];

export const reportConfigPartTimeGroupingInfo = {
	year: {
		id: 'year',
		name: 'Year'
	},
	month: {
		id: 'month',
		name: 'Month'
	},
	quarter: {
		id: 'quarter',
		name: 'Quarter'
	},
	week: {
		id: 'week',
		name: 'Week'
	}
} satisfies {
	[key in ReportConfigPartTimeGroupingType]: {
		id: key;
		name: string;
	};
};

export type ReportConfigPartTimeGroupingInfoType = typeof reportConfigPartTimeGroupingInfo;

export const reportConfigPartTimeGroupingDropdown = Object.values(
	reportConfigPartTimeGroupingInfo
).map((option) => {
	return {
		name: option.name,
		value: option.id
	};
});
