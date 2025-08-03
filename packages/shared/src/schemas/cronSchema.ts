import * as z from 'zod';

// Cron job execution status enum
export const cronExecutionStatusEnum = ['completed', 'failed', 'timeout', 'running'] as const;
export type CronExecutionStatusType = (typeof cronExecutionStatusEnum)[number];

// Cron job triggered by enum
export const cronTriggeredByEnum = ['system', 'manual', 'api', 'scheduler'] as const;
export type CronTriggeredByType = (typeof cronTriggeredByEnum)[number];

// Create cron job schema
export const createCronJobSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	schedule: z.string(),
	isEnabled: z.boolean().default(true),
	timeoutMs: z.number().default(120000),
	maxRetries: z.number().default(0),
});

export type CreateCronJobSchemaType = z.infer<typeof createCronJobSchema>;

// Update cron job schema
export const updateCronJobSchema = z.object({
	id: z.string(),
	name: z.string().optional(),
	description: z.string().optional(),
	schedule: z.string().optional(),
	isEnabled: z.boolean().optional(),
	timeoutMs: z.number().optional(),
	maxRetries: z.number().optional(),
	modifiedBy: z.string(),
});

export type UpdateCronJobSchemaType = z.infer<typeof updateCronJobSchema>;

// Cron job order by enum
const cronJobOrderByEnum = [
	'name',
	'schedule', 
	'isEnabled',
	'createdAt',
	'updatedAt',
	'lastRun',
	'successRate'
] as const;

type CronJobOrderByEnumType = (typeof cronJobOrderByEnum)[number];

// Cron job filter schema
export const cronJobFilterSchema = z.object({
	textFilter: z.string().optional(),
	id: z.string().optional(),
	idArray: z.array(z.string()).optional(),
	excludeIdArray: z.array(z.string()).optional(),
	name: z.string().optional(),
	nameArray: z.array(z.string()).optional(),
	excludeNameArray: z.array(z.string()).optional(),
	isEnabled: z.boolean().optional(),
	schedule: z.string().optional(),
	scheduleArray: z.array(z.string()).optional(),
	excludeScheduleArray: z.array(z.string()).optional(),
	
	page: z.number().default(0).optional(),
	pageSize: z.number().default(10).optional(),
	orderBy: z
		.array(z.object({ field: z.enum(cronJobOrderByEnum), direction: z.enum(['asc', 'desc']) }))
		.default([{ direction: 'asc', field: 'name' }])
		.optional(),
});

export type CronJobFilterSchemaType = z.infer<typeof cronJobFilterSchema>;
export type CronJobFilterSchemaOutputType = z.output<typeof cronJobFilterSchema>;
export type CronJobFilterSchemaWithoutPaginationType = Omit<
	CronJobFilterSchemaType,
	'page' | 'pageSize' | 'orderBy'
>;

// Cron execution order by enum
const cronExecutionOrderByEnum = [
	'startedAt',
	'completedAt',
	'durationMs',
	'status',
	'triggeredBy',
	'retryCount',
	'jobName'
] as const;

type CronExecutionOrderByEnumType = (typeof cronExecutionOrderByEnum)[number];

// Cron job execution filter schema
export const cronExecutionFilterSchema = z.object({
	textFilter: z.string().optional(),
	id: z.string().optional(),
	idArray: z.array(z.string()).optional(),
	excludeIdArray: z.array(z.string()).optional(),
	cronJobId: z.string().optional(),
	cronJobIdArray: z.array(z.string()).optional(),
	excludeCronJobIdArray: z.array(z.string()).optional(),
	status: z.enum(cronExecutionStatusEnum).optional(),
	statusArray: z.array(z.enum(cronExecutionStatusEnum)).optional(),
	excludeStatusArray: z.array(z.enum(cronExecutionStatusEnum)).optional(),
	triggeredBy: z.enum(cronTriggeredByEnum).optional(),
	triggeredByArray: z.array(z.enum(cronTriggeredByEnum)).optional(),
	excludeTriggeredByArray: z.array(z.enum(cronTriggeredByEnum)).optional(),
	triggeredByUserId: z.string().optional(),
	triggeredByUserIdArray: z.array(z.string()).optional(),
	excludeTriggeredByUserIdArray: z.array(z.string()).optional(),
	startedAfter: z.date().optional(),
	startedBefore: z.date().optional(),
	completedAfter: z.date().optional(),
	completedBefore: z.date().optional(),
	minDuration: z.number().optional(),
	maxDuration: z.number().optional(),
	retryCountMin: z.number().optional(),
	retryCountMax: z.number().optional(),
	hasError: z.boolean().optional(),
	hasOutput: z.boolean().optional(),
	
	page: z.number().default(0).optional(),
	pageSize: z.number().default(10).optional(),
	orderBy: z
		.array(z.object({ field: z.enum(cronExecutionOrderByEnum), direction: z.enum(['asc', 'desc']) }))
		.default([{ direction: 'desc', field: 'startedAt' }])
		.optional(),
});

export type CronExecutionFilterSchemaType = z.infer<typeof cronExecutionFilterSchema>;
export type CronExecutionFilterSchemaOutputType = z.output<typeof cronExecutionFilterSchema>;
export type CronExecutionFilterSchemaWithoutPaginationType = Omit<
	CronExecutionFilterSchemaType,
	'page' | 'pageSize' | 'orderBy'
>;

// Simplified filter schemas for URL parameters
export const cronJobUrlFilterSchema = z.object({
	textFilter: z.string().optional(),
	isEnabled: z.boolean().optional(),
	page: z.coerce.number().default(1).optional(),
	pageSize: z.coerce.number().default(25).optional(),
	orderBy: z.string().default('name-asc').optional(),
});

export type CronJobUrlFilterSchemaType = z.infer<typeof cronJobUrlFilterSchema>;

export const cronExecutionUrlFilterSchema = z.object({
	textFilter: z.string().optional(),
	jobId: z.string().optional(),
	status: z.enum(cronExecutionStatusEnum).optional(),
	triggeredBy: z.enum(cronTriggeredByEnum).optional(),
	page: z.coerce.number().default(1).optional(),
	pageSize: z.coerce.number().default(25).optional(),
	orderBy: z.string().default('startedAt-desc').optional(),
});

export type CronExecutionUrlFilterSchemaType = z.infer<typeof cronExecutionUrlFilterSchema>;

// Helper functions to convert URL filter to full filter
export const urlFilterToCronJobFilter = (urlFilter: CronJobUrlFilterSchemaType): CronJobFilterSchemaType => {
	const [field, direction] = (urlFilter.orderBy || 'name-asc').split('-') as [CronJobOrderByEnumType, 'asc' | 'desc'];
	
	return {
		textFilter: urlFilter.textFilter,
		isEnabled: urlFilter.isEnabled,
		page: (urlFilter.page || 1) - 1, // Convert to 0-based indexing
		pageSize: urlFilter.pageSize || 25,
		orderBy: [{ field, direction: direction || 'asc' }],
	};
};

export const urlFilterToCronExecutionFilter = (urlFilter: CronExecutionUrlFilterSchemaType): CronExecutionFilterSchemaType => {
	const [field, direction] = (urlFilter.orderBy || 'startedAt-desc').split('-') as [CronExecutionOrderByEnumType, 'asc' | 'desc'];
	
	return {
		textFilter: urlFilter.textFilter,
		cronJobId: urlFilter.jobId,
		status: urlFilter.status,
		triggeredBy: urlFilter.triggeredBy,
		page: (urlFilter.page || 1) - 1, // Convert to 0-based indexing
		pageSize: urlFilter.pageSize || 25,
		orderBy: [{ field, direction: direction || 'desc' }],
	};
};