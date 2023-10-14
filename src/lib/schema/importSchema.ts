export const importSourceEnum = ['csv'] as const;
export const importTypeEnum = [
	'transaction',
	'account',
	'bill',
	'budget',
	'category',
	'tag',
	'label'
] as const;

export const importDetailStatusEnum = [
	'error',
	'processed',
	'duplicate',
	'imported',
	'importError'
] as const;
export const importStatusEnum = ['created', 'error', 'processed', 'imported', 'complete'] as const;
