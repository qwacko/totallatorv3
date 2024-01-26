import type { SpanOptionType } from './spanOptions';
import type { SummingEnumType } from './summingEnum';
import type { TimeGroupingType } from './timeGroupingEnum';

export const displaySparklineOptionsEnum = [
	'none',
	'yearly',
	'monthly',
	'yearlyWithinRange',
	'monthlyWithinRange',
	'yearlyAll',
	'monthlyAll',
	'countYearly',
	'countMonthly',
	'countYearlyWithinRange',
	'countMonthlyWithinRange',
	'countYearlyAll',
	'countMonthlyAll'
] as const;

export type DisplaySparklineOptionsType = (typeof displaySparklineOptionsEnum)[number];

export const displaySparklineOptionsData = {
	none: {
		id: 'none',
		name: 'None'
	},
	yearly: {
		id: 'yearly',
		name: 'Yearly (From Start)',
		type: 'sum',
		span: 'upToRange',
		grouping: 'year'
	},
	monthly: {
		id: 'monthly',
		name: 'Monthly (From Start)',
		type: 'sum',
		span: 'upToRange',
		grouping: 'month'
	},
	yearlyWithinRange: {
		id: 'yearlyWithinRange',
		name: 'Yearly (Within Time Range)',
		type: 'sum',
		span: 'withinRange',
		grouping: 'year'
	},
	monthlyWithinRange: {
		id: 'monthlyWithinRange',
		name: 'Monthly (Within Time Range)',
		type: 'sum',
		span: 'withinRange',
		grouping: 'month'
	},
	yearlyAll: {
		id: 'yearlyAll',
		name: 'Yearly (All)',
		type: 'sum',
		span: 'all',
		grouping: 'year'
	},
	monthlyAll: {
		id: 'monthlyAll',
		name: 'Monthly (All)',
		type: 'sum',
		span: 'all',
		grouping: 'month'
	},
	countYearly: {
		id: 'countYearly',
		name: 'Count Yearly (From Start)',
		type: 'count',
		span: 'upToRange',
		grouping: 'year'
	},
	countMonthly: {
		id: 'countMonthly',
		name: 'Count Monthly (From Start)',
		type: 'count',
		span: 'upToRange',
		grouping: 'month'
	},
	countYearlyWithinRange: {
		id: 'countYearlyWithinRange',
		name: 'Count Yearly (Within Time Range)',
		type: 'count',
		span: 'withinRange',
		grouping: 'year'
	},
	countMonthlyWithinRange: {
		id: 'countMonthlyWithinRange',
		name: 'Count Monthly (Within Time Range)',
		type: 'count',
		span: 'withinRange',
		grouping: 'month'
	},
	countYearlyAll: {
		id: 'countYearlyAll',
		name: 'Count Yearly (All)',
		type: 'count',
		span: 'all',
		grouping: 'year'
	},
	countMonthlyAll: {
		id: 'countMonthlyAll',
		name: 'Count Monthly (All)',
		type: 'count',
		span: 'all',
		grouping: 'month'
	}
} satisfies {
	[key in DisplaySparklineOptionsType]: {
		id: key;
		name: string;
		type?: SummingEnumType;
		span?: SpanOptionType;
		grouping?: TimeGroupingType;
	};
};

export const displaySparklineOptionsDropdown = Object.values(displaySparklineOptionsData).map(
	(option) => {
		return {
			name: option.name,
			value: option.id
		};
	}
);
