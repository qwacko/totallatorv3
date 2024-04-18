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
export const billColumnsStore = writable(['actions', 'title', 'status', 'total', 'count']);
export const budgetColumnsStore = writable(['actions', 'title', 'status', 'total', 'count']);
export const categoryColumnsStore = writable(['actions', 'title', 'status', 'total', 'count']);
export const labelColumnsStore = writable(['actions', 'title', 'status', 'total', 'count']);
export const fileColumnsStore = writable([
	'actions',
	'createdAt',
	'thumbnailFilename',
	'title',
	'originalFilename',
	'links',
	'type',
	'reason',
	'size'
]);
export const reusableFilterColumnsStore = writable([
	'actions',
	'journalCount',
	'applyAutomatically',
	'applyFollowingImport',
	'listed',
	'modificationType',
	'group',
	'title',
	'filterText',
	'changeText'
]);
export const importColumnsStore = writable([
	'actions',
	'createdAt',
	'autoProcess',
	'autoClean',
	'title',
	'status',
	'type',
	'mapping',
	'numProcessed',
	'numDuplicate',
	'numImport',
	'numErrors'
]);

export const autoImportColumnsStore = writable([
	'actions',
	'enabled',
	'autoProcess',
	'autoClean',
	'title',
	'type',
	'frequency',
	'importMapping'
]);

export const importMappingColumnStore = writable(['actions', 'title']);

export const journalColumnsStore = writable([
	'actions',
	'dateText',
	'account',
	'direction',
	'payee',
	'description',
	'amount',
	'total',
	'relations'
]);

export const numberRows = writable(10);
