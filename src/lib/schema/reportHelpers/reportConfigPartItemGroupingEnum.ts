export const reportConfigPartItemGroupingEnum = [
	'account',
	'account_type',
	'tag',
	'category',
	'bill',
	'budget'
] as const;

export type ReportConfigPartItemGroupingType = (typeof reportConfigPartItemGroupingEnum)[number];

export const reportConfigPartItemGroupingInfo = {
	account: {
		id: 'account',
		name: 'Account'
	},
	account_type: {
		id: 'account_type',
		name: 'Account Type'
	},
	tag: {
		id: 'tag',
		name: 'Tag'
	},
	category: {
		id: 'category',
		name: 'Category'
	},
	bill: {
		id: 'bill',
		name: 'Bill'
	},
	budget: {
		id: 'budget',
		name: 'Budget'
	}
} satisfies {
	[key in ReportConfigPartItemGroupingType]: {
		id: key;
		name: string;
	};
};

export type ReportConfigPartItemGroupingInfoType = typeof reportConfigPartItemGroupingInfo;

export const reportConfigPartItemGroupingDropdown = Object.values(
	reportConfigPartItemGroupingInfo
).map((option) => {
	return {
		name: option.name,
		value: option.id
	};
});
