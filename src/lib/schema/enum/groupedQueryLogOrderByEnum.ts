export const groupedQueryLogOrderByEnum = [
	'title',
	'maxDuration',
	'minDuration',
	'averageDuration',
	'count'
] as const;

export type GroupedQueryLogOrderByEnumType = (typeof groupedQueryLogOrderByEnum)[number];

type GroupedQueryLogOrderByEnumTitles = {
	[K in GroupedQueryLogOrderByEnumType]: string;
};

// This will be valid for demonstration purposes
const groupedQueryLogEnumTitles: GroupedQueryLogOrderByEnumTitles = {
	title: 'Title',
	maxDuration: 'Max Duration',
	minDuration: 'Min Duration',
	averageDuration: 'Average Duration',
	count: 'Count'
};

export const groupedQueryLogOrderByEnumToText = (input: GroupedQueryLogOrderByEnumType) => {
	return groupedQueryLogEnumTitles[input];
};
