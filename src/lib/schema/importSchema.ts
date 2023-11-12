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

export const importTypeToTitle = (type: (typeof importTypeEnum)[number]) => {
	if (type === 'transaction') {
		return 'Transactions';
	}
	if (type === 'account') {
		return 'Accounts';
	}
	if (type === 'bill') {
		return 'Bills';
	}
	if (type === 'budget') {
		return 'Budgets';
	}
	if (type === 'category') {
		return 'Categories';
	}
	if (type === 'tag') {
		return 'Tags';
	}
	if (type === 'label') {
		return 'Labels';
	}
	if (type === 'mappedImport') {
		return 'Mapped Imports';
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
export const importStatusEnum = ['created', 'error', 'processed', 'imported', 'complete'] as const;

export type ImportStatusType = (typeof importStatusEnum)[number];

export const importStatusToColour = (status: ImportStatusType) => {
	if (status === 'complete') {
		return 'green';
	}
	if (status === 'created') {
		return 'blue';
	}
	if (status === 'error') {
		return 'red';
	}
	if (status === 'imported') {
		return 'green';
	}
	if (status === 'processed') {
		return 'blue';
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
	if (status === 'imported') {
		return 'Imported';
	}
	if (status === 'processed') {
		return 'Processed';
	}

	return 'primary';
};
