import { z } from 'zod';

export const importSourceEnum = ['csv', 'json'] as const;
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
	'importMappingTitle',
	'autoProcess',
	'autoClean',
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
	autoProcess: 'Auto Process',
	autoClean: 'Auto Clean',
	title: 'Title',
	filename: 'Filename',
	status: 'Status',
	source: 'Source',
	type: 'Type',
	importMappingTitle: 'Import Mapping',
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

export const createImportSchema = z
	.object({
		importType: z.enum(importTypeEnum).default('mappedImport'),
		importMappingId: z.string().optional(),
		autoProcess: z.boolean().default(false),
		autoClean: z.boolean().default(false),
		checkImportedOnly: z.boolean().default(false),
		file: z.instanceof(File, { message: 'Please Upload A File' })
	})
	.refine(
		(data) => {
			if (data.importType === 'mappedImport' && !data.importMappingId) {
				return false;
			}
			return true;
		},
		{ message: 'A mapping is reqruired for a mapped import', path: ['importMappingId'] }
	);

export type UpdateImportSchemaType = z.infer<typeof createImportSchema>;

export const updateImportSchema = z.object({
	id: z.string(),
	autoProces: z.boolean().optional(),
	autoClean: z.boolean().optional(),
	checkImportedOnly: z.boolean().optional()
});

export type CreateImportSchemaType = z.infer<typeof createImportSchema>;

export const importFilterSchema = z.object({
	id: z.string().optional(),
	idArray: z.array(z.string()).optional(),
	textFilter: z.string().optional(),
	title: z.coerce.string().optional(),
	filename: z.coerce.string().optional(),
	autoProcess: z.boolean().optional(),
	autoClean: z.boolean().optional(),
	source: z.array(z.enum(importSourceEnum)).optional(),
	type: z.array(z.enum(importTypeEnum)).optional(),
	mapping: z.string().optional(),
	status: z.array(z.enum(importStatusEnum)).optional(),
	autoImportId: z.string().optional(),

	//Page Information
	page: z.number().default(0).optional(),
	pageSize: z.number().default(10).optional(),
	orderBy: z
		.array(z.object({ field: z.enum(orderByEnum), direction: z.enum(['asc', 'desc']) }))
		.default([{ direction: 'desc', field: 'createdAt' }])
		.optional()
});

export type ImportFilterSchemaType = z.infer<typeof importFilterSchema>;
