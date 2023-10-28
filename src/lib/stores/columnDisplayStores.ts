import { writable } from 'svelte/store';

// First param `preferences` is the local storage key.
// Second param is the initial value.
export const accountColumnsStore = writable([
	'actions',
	'accountGroup',
	'accountGroup2',
	'accountGroup3',
	'title',
	'type',
	'status',
	'isCash',
	'isNetWorth',
	'startDate',
	'endDate',
	'total',
	'count'
]);

export const tagColumnsStore = writable(['actions', 'title', 'status', 'total', 'count']);
