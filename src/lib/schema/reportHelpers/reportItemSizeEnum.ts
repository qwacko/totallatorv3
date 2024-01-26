export const reportItemSizeEnum = ['small', 'medium', 'large'] as const;
export type ReportItemSizeType = (typeof reportItemSizeEnum)[number];

export const reportItemSizeDropdowns = [
	{ name: 'Small', value: 'small' },
	{ name: 'Medium', value: 'medium' },
	{ name: 'Large', value: 'large' }
];
