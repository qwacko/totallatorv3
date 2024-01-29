import type { SpanOptionType } from './spanOptions';
import type { SummingEnumType } from './summingEnum';
import type { TimeGroupingType } from './timeGroupingEnum';

export const displaySparklineOptionsEnum = [
	'none',
	'yearlyChange',
	'monthlyChange',
	'yearlyCount',
	'monthlyCount',
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
	yearlyChange: {
		id: 'yearlyChange',
		name: 'Yearly Change',
		type: 'sum',
		span: 'withinRange',
		grouping: 'year',
		runningTotal: false,
		graphType: 'bar'
	},
	monthlyChange: {
		id: 'monthlyChange',
		name: 'Monthly Change',
		type: 'sum',
		span: 'withinRange',
		grouping: 'month',
		runningTotal: false,
		graphType: 'bar'
	},
	yearlyCount: {
		id: 'yearlyCount',
		name: 'Yearly Count',
		type: 'count',
		span: 'withinRange',
		grouping: 'year',
		runningTotal: false,
		graphType: 'bar'
	},
	monthlyCount: {
		id: 'monthlyCount',
		name: 'Monthly Count',
		type: 'count',
		span: 'withinRange',
		grouping: 'month',
		runningTotal: false,
		graphType: 'bar'
	},
	yearly: {
		id: 'yearly',
		name: 'Yearly (From Start)',
		type: 'sum',
		span: 'upToRange',
		grouping: 'year',
		runningTotal: true,
		graphType: 'area'
	},
	monthly: {
		id: 'monthly',
		name: 'Monthly (From Start)',
		type: 'sum',
		span: 'upToRange',
		grouping: 'month',
		runningTotal: true,
		graphType: 'area'
	},
	yearlyWithinRange: {
		id: 'yearlyWithinRange',
		name: 'Yearly (Within Time Range)',
		type: 'sum',
		span: 'withinRange',
		grouping: 'year',
		runningTotal: true,
		graphType: 'area'
	},
	monthlyWithinRange: {
		id: 'monthlyWithinRange',
		name: 'Monthly (Within Time Range)',
		type: 'sum',
		span: 'withinRange',
		grouping: 'month',
		runningTotal: true,
		graphType: 'area'
	},
	yearlyAll: {
		id: 'yearlyAll',
		name: 'Yearly (All)',
		type: 'sum',
		span: 'all',
		grouping: 'year',
		runningTotal: true,
		graphType: 'area'
	},
	monthlyAll: {
		id: 'monthlyAll',
		name: 'Monthly (All)',
		type: 'sum',
		span: 'all',
		grouping: 'month',
		runningTotal: true,
		graphType: 'area'
	},
	countYearly: {
		id: 'countYearly',
		name: 'Count Yearly (From Start)',
		type: 'count',
		span: 'upToRange',
		grouping: 'year',
		runningTotal: true,
		graphType: 'area'
	},
	countMonthly: {
		id: 'countMonthly',
		name: 'Count Monthly (From Start)',
		type: 'count',
		span: 'upToRange',
		grouping: 'month',
		runningTotal: true,
		graphType: 'area'
	},
	countYearlyWithinRange: {
		id: 'countYearlyWithinRange',
		name: 'Count Yearly (Within Time Range)',
		type: 'count',
		span: 'withinRange',
		grouping: 'year',
		runningTotal: true,
		graphType: 'area'
	},
	countMonthlyWithinRange: {
		id: 'countMonthlyWithinRange',
		name: 'Count Monthly (Within Time Range)',
		type: 'count',
		span: 'withinRange',
		grouping: 'month',
		runningTotal: true,
		graphType: 'area'
	},
	countYearlyAll: {
		id: 'countYearlyAll',
		name: 'Count Yearly (All)',
		type: 'count',
		span: 'all',
		grouping: 'year',
		runningTotal: true,
		graphType: 'area'
	},
	countMonthlyAll: {
		id: 'countMonthlyAll',
		name: 'Count Monthly (All)',
		type: 'count',
		span: 'all',
		grouping: 'month',
		runningTotal: true,
		graphType: 'area'
	}
} satisfies {
	[key in DisplaySparklineOptionsType]: {
		id: key;
		name: string;
		type?: SummingEnumType;
		span?: SpanOptionType;
		grouping?: TimeGroupingType;
		runningTotal?: boolean;
		graphType?: 'area' | 'bar';
	};
};

export type DisplaySparklineOptionsDataType = typeof displaySparklineOptionsData;

export const displaySparklineOptionsDropdown = Object.values(displaySparklineOptionsData).map(
	(option) => {
		return {
			name: option.name,
			value: option.id
		};
	}
);
