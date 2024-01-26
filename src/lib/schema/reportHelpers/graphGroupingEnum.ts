export const graphGroupingEnum = [
	'account',
	'account_type',
	'tag',
	'category',
	'bill',
	'budget'
] as const;
export type GraphGroupingType = (typeof graphGroupingEnum)[number];
