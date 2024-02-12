export const reportConfigPartItemGroupingEnum = [
	'account',
	'account_type',
	'account_group',
	'account_group_2',
	'account_group_3',
	'account_group_combined',
	'account_title',
	'tag',
	'tag_group',
	'category',
	'category_group',
	'bill',
	'budget',
	'none'
] as const;

export type ReportConfigPartItemGroupingType = (typeof reportConfigPartItemGroupingEnum)[number];

export const reportConfigPartItemGroupingInfo = {
	account: {
		id: 'account',
		name: 'Account',
		emptyTitle: 'No Account',
		groupedOtherTitle: 'Other Accounts'
	},
	account_type: {
		id: 'account_type',
		name: 'Account Type',
		emptyTitle: 'No Account Type',
		groupedOtherTitle: 'Other Account Types'
	},
	account_group: {
		id: 'account_group',
		name: 'Account Group',
		emptyTitle: 'No Account Group',
		groupedOtherTitle: 'Other Account Groups'
	},
	account_group_2: {
		id: 'account_group_2',
		name: 'Account Group 2',
		emptyTitle: 'No Account Group 2',
		groupedOtherTitle: 'Other Account Groups 2'
	},
	account_group_3: {
		id: 'account_group_3',
		name: 'Account Group 3',
		emptyTitle: 'No Account Group 3',
		groupedOtherTitle: 'Other Account Groups 3'
	},
	account_group_combined: {
		id: 'account_group_combined',
		name: 'Account Group Combined',
		emptyTitle: 'No Account Group Combined',
		groupedOtherTitle: 'Other Account Groups Combined'
	},
	account_title: {
		id: 'account_title',
		name: 'Account Title',
		emptyTitle: 'No Account Title',
		groupedOtherTitle: 'Other Account Titles'
	},
	tag: {
		id: 'tag',
		name: 'Tag',
		emptyTitle: 'No Tag',
		groupedOtherTitle: 'Other Tags'
	},
	tag_group: {
		id: 'tag_group',
		name: 'Tag Group',
		emptyTitle: 'No Tag Group',
		groupedOtherTitle: 'Other Tag Groups'
	},
	category: {
		id: 'category',
		name: 'Category',
		emptyTitle: 'No Category',
		groupedOtherTitle: 'Other Categories'
	},
	category_group: {
		id: 'category_group',
		name: 'Category Group',
		emptyTitle: 'No Category Group',
		groupedOtherTitle: 'Other Category Groups'
	},
	bill: {
		id: 'bill',
		name: 'Bill',
		emptyTitle: 'No Bill',
		groupedOtherTitle: 'Other Bills'
	},
	budget: {
		id: 'budget',
		name: 'Budget',
		emptyTitle: 'No Budget',
		groupedOtherTitle: 'Other Budgets'
	},
	none: {
		id: 'none',
		name: 'None',
		emptyTitle: 'None',
		groupedOtherTitle: 'None'
	}
} satisfies {
	[key in ReportConfigPartItemGroupingType]: {
		id: key;
		name: string;
		emptyTitle: string;
		groupedOtherTitle: string;
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
