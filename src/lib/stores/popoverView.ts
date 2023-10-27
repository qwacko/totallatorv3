import { writable } from 'svelte/store';

export const popoverViewStore = writable<popoverViewSetting>({
	type: 'Line',
	dateRange: 'toNow',
	includeTransfers: false
});

export type popoverViewOptions =
	| 'Line'
	| 'Flow'
	| 'Tag'
	| 'Account'
	| 'Category'
	| 'Bill'
	| 'Budget';

export type popoverViewDates = 'all' | 'last12' | 'toNow';

export type popoverViewSetting = {
	dateRange: popoverViewDates;
	includeTransfers: boolean;
	type: popoverViewOptions;
};

export const popoverViewEnum: popoverViewOptions[] = [
	'Line',
	'Flow',
	'Tag',
	'Account',
	'Category',
	'Bill',
	'Budget'
];

export const showSummaryStore = writable<boolean>(true);
