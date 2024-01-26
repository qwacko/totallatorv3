import type { SpanOptionType } from './spanOptions';
import type { SummingEnumType } from './summingEnum';

export const displayTimeOptionsEnum = [
	'none',
	'all',
	'withinRange',
	'upToRange',
	'countAll',
	'countWithinRange',
	'countUpToRange'
] as const;

export const displayTimeOptionsData = {
	none: {
		id: 'none',
		name: 'None'
	},
	all: {
		id: 'all',
		name: 'Sum All',
		type: 'sum',
		span: 'all'
	},
	withinRange: {
		id: 'withinRange',
		name: 'Sum Within Range',
		type: 'sum',
		span: 'withinRange'
	},
	upToRange: {
		id: 'upToRange',
		name: 'Sum Up To Range',
		type: 'sum',
		span: 'upToRange'
	},
	countAll: {
		id: 'countAll',
		name: 'Count All',
		type: 'count',
		span: 'all'
	},
	countWithinRange: {
		id: 'countWithinRange',
		name: 'Count Within Range',
		type: 'count',
		span: 'withinRange'
	},
	countUpToRange: {
		id: 'countUpToRange',
		name: 'Count Up To Range',
		type: 'count',
		span: 'upToRange'
	}
} satisfies {
	[key in DisplayTimeOptionsType]: {
		id: key;
		name: string;
		type?: SummingEnumType;
		span?: SpanOptionType;
	};
};

export type DisplayTimeOptionsType = (typeof displayTimeOptionsEnum)[number];

export const displayTimeOptionsDropdown = displayTimeOptionsEnum.map((option) => {
	return { name: displayTimeOptionsData[option].name, value: option };
});
