import { writable } from 'svelte/store';

export const popoverViewStore = writable<popoverViewOptions>('All');

export type popoverViewOptions =
	| 'Recent'
	| 'All'
	| 'Flow'
	| 'Tag'
	| 'Account'
	| 'Category'
	| 'Bill'
	| 'Budget';

export const popoverViewEnum: popoverViewOptions[] = [
	'Recent',
	'All',
	'Flow',
	'Tag',
	'Account',
	'Category',
	'Bill',
	'Budget'
];

export const showSummaryStore = writable<boolean>(true);
