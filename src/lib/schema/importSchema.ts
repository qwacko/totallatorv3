import { z } from 'zod';

export const importSourceEnum = ['csv'] as const;
export const importTypeEnum = [
	'transaction',
	'account',
	'bill',
	'budget',
	'category',
	'tag',
	'label',
	'mappedImport'
] as const;

export type importTypeType = (typeof importTypeEnum)[number];

export const importTypeToTitle = (type: importTypeType, single = false) => {
	if (type === 'transaction') {
		return single ? 'Transaction' : 'Transactions';
	}
	if (type === 'account') {
		return single ? 'Account' : 'Accounts';
	}
	if (type === 'bill') {
		return single ? 'Bill' : 'Bills';
	}
	if (type === 'budget') {
		return single ? 'Budget' : 'Budgets';
	}
	if (type === 'category') {
		return single ? 'Category' : 'Categories';
	}
	if (type === 'tag') {
		return single ? 'Tag' : 'Tags';
	}
	if (type === 'label') {
		return single ? 'Label' : 'Labels';
	}
	if (type === 'mappedImport') {
		return single ? 'Mapped Import' : 'Mapped Imports';
	}

	return 'Unknown';
};

export const importDetailStatusEnum = [
	'error',
	'processed',
	'duplicate',
	'imported',
	'importError'
] as const;
export const importStatusEnum = [
	'created',
	'error',
	'processed',
	'importing',
	'awaitingImport',
	'complete'
] as const;

export type ImportStatusType = (typeof importStatusEnum)[number];
export type ImportDetailStatusEnum = (typeof importDetailStatusEnum)[number];

export const importStatusToColour = (status: ImportStatusType | ImportDetailStatusEnum) => {
	if (status === 'complete') {
		return 'green';
	}
	if (status === 'created') {
		return 'blue';
	}
	if (status === 'error' || status === 'importError') {
		return 'red';
	}
	if (status === 'imported') {
		return 'green';
	}
	if (status === 'processed' || status === 'awaitingImport' || status === 'importing') {
		return 'blue';
	}
	if (status === 'duplicate') {
		return 'dark';
	}

	return 'primary';
};

export const importStatusToTest = (status: ImportStatusType) => {
	if (status === 'complete') {
		return 'Complete';
	}
	if (status === 'created') {
		return 'Created';
	}
	if (status === 'error') {
		return 'Error';
	}
	if (status === 'awaitingImport') {
		return 'Awaiting Import...';
	}
	if (status === 'importing') {
		return 'Importing...';
	}
	if (status === 'processed') {
		return 'Processed';
	}

	return 'primary';
};

const orderByEnum = [
	'createdAt',
	'title',
	'filename',
	'status',
	'source',
	'type',
	'numErrors',
	'numImportErrors',
	'numProcessed',
	'numDuplicate',
	'numImport',
	'numImportError'
] as const;

type OrderByEnumType = (typeof orderByEnum)[number];

export type ImportOrderByEnum = OrderByEnumType;

type OrderByEnumTitles = {
	[K in OrderByEnumType]: string;
};

// This will be valid for demonstration purposes
const enumTitles = {
	createdAt: 'Date',
	title: 'Title',
	filename: 'Filename',
	status: 'Status',
	source: 'Source',
	type: 'Type',
	numErrors: 'Number Errors',
	numImportErrors: 'Number Import Errors',
	numProcessed: 'Number Processed',
	numDuplicate: 'Number Duplicate',
	numImport: 'Number Imported',
	numImportError: 'Number Import Errors'
} satisfies OrderByEnumTitles;

export const importOrderByEnumToText = (input: OrderByEnumType) => {
	return enumTitles[input];
};

export const importFilterSchema = z.object({
	id: z.string().optional(),
	idArray: z.array(z.string()).optional(),
	title: z.coerce.string().optional(),
	filename: z.coerce.string().optional(),
	source: z.array(z.enum(importSourceEnum)).optional(),
	type: z.array(z.enum(importTypeEnum)).optional(),
	status: z.array(z.enum(importStatusEnum)).optional(),

	//Page Information
	page: z.number().default(0).optional(),
	pageSize: z.number().default(10).optional(),
	orderBy: z
		.array(z.object({ field: z.enum(orderByEnum), direction: z.enum(['asc', 'desc']) }))
		.default([{ direction: 'desc', field: 'createdAt' }])
		.optional()
});

export type ImportFilterSchemaType = z.infer<typeof importFilterSchema>;
