export const logDomainEnum = [
	'accounts',
	'auth',
	'auto-import',
	'backup',
	'bills',
	'budgets',
	'categories',
	'cron',
	'database',
	'export',
	'files',
	'import',
	'journals',
	'labels',
	'llm',
	'materialized-views',
	'notes',
	'queries',
	'reports',
	'tags',
	'users',
	'server',
	''
] as const;
export const logActionEnum = ['Read', 'Update', 'Create', 'Delete', 'Other', ''] as const;
export const logLevelEnum = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'] as const;
export const logDestinationEnum = ['console', 'database'] as const;
