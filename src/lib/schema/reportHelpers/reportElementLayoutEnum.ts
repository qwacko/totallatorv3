export const reportElementLayoutEnum = [
	'singleItem',
	'twoItemsHorizontal',
	'twoItemsVertical',
	'twoSmallOneLargeVertical',
	'twoSmallOneLargeHorizontal'
] as const;

export type ReportElementLayoutType = (typeof reportElementLayoutEnum)[number];

export const reportElementLayoutInfo = {
	singleItem: {
		id: 'singleItem',
		name: 'Single Item'
	},
	twoItemsHorizontal: {
		id: 'twoItemsHorizontal',
		name: 'Two Items Horizontal'
	},
	twoItemsVertical: {
		id: 'twoItemsVertical',
		name: 'Two Items Vertical'
	},
	twoSmallOneLargeVertical: {
		id: 'twoSmallOneLargeVertical',
		name: '2 + 1 Vertical'
	},
	twoSmallOneLargeHorizontal: {
		id: 'twoSmallOneLargeHorizontal',
		name: '2 + 1 Horizontal'
	}
} satisfies {
	[key in ReportElementLayoutType]: {
		id: key;
		name: string;
	};
};

export type ReportElementLayoutInfoType = typeof reportElementLayoutInfo;

export const reportElementLayoutDropdown = Object.values(reportElementLayoutInfo).map((option) => {
	return {
		name: option.name,
		value: option.id
	};
});
