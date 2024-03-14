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
