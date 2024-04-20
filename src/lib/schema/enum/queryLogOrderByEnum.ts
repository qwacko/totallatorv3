export const queryLogOrderByEnum = ['title', 'query', 'time', 'duration'] as const;

export type QueryLogOrderByEnumType = (typeof queryLogOrderByEnum)[number];

type QueryLogOrderByEnumTitles = {
	[K in QueryLogOrderByEnumType]: string;
};

// This will be valid for demonstration purposes
const queryLogEnumTitles: QueryLogOrderByEnumTitles = {
	title: 'Title',
	query: 'Query',
	time: 'Time',
	duration: 'Duration'
};

export const queryLogOrderByEnumToText = (input: QueryLogOrderByEnumType) => {
	return queryLogEnumTitles[input];
};
