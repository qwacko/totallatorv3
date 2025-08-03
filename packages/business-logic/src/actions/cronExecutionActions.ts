import { desc, eq, and, gte, lte, count } from 'drizzle-orm';
import { cronJob, cronJobExecution } from '@totallator/database';
import { getContextDB } from '@totallator/context';
import type { 
	CronExecutionFilterSchemaType,
} from '@totallator/shared';

/**
 * Actions for managing cron job executions.
 * Provides CRUD operations and statistics for execution history.
 */

/**
 * Get cron job execution history with filtering and pagination
 */
export const getCronJobExecutions = async (filter?: CronExecutionFilterSchemaType) => {
	const db = getContextDB();
	const conditions = [];

	// Build where conditions (simplified for basic functionality)
	if (filter?.id) conditions.push(eq(cronJobExecution.id, filter.id));
	if (filter?.cronJobId) conditions.push(eq(cronJobExecution.cronJobId, filter.cronJobId));
	if (filter?.status) conditions.push(eq(cronJobExecution.status, filter.status));
	if (filter?.triggeredBy) conditions.push(eq(cronJobExecution.triggeredBy, filter.triggeredBy));
	if (filter?.triggeredByUserId) conditions.push(eq(cronJobExecution.triggeredByUserId, filter.triggeredByUserId));
	if (filter?.startedAfter) conditions.push(gte(cronJobExecution.startedAt, filter.startedAfter));
	if (filter?.startedBefore) conditions.push(lte(cronJobExecution.startedAt, filter.startedBefore));
	if (filter?.minDuration !== undefined) conditions.push(gte(cronJobExecution.durationMs, filter.minDuration));
	if (filter?.maxDuration !== undefined) conditions.push(lte(cronJobExecution.durationMs, filter.maxDuration));
	// TODO: Add more complex filtering when needed

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	// Build order by (simplified)
	const orderByClause = [desc(cronJobExecution.startedAt)]; // Default ordering by startedAt desc

	// Apply pagination
	const limit = filter?.pageSize || 50;
	const offset = ((filter?.page || 0) * limit);

	const [executions, totalCountResult] = await Promise.all([
		db
			.select({
				id: cronJobExecution.id,
				cronJobId: cronJobExecution.cronJobId,
				startedAt: cronJobExecution.startedAt,
				completedAt: cronJobExecution.completedAt,
				durationMs: cronJobExecution.durationMs,
				status: cronJobExecution.status,
				triggeredBy: cronJobExecution.triggeredBy,
				triggeredByUserId: cronJobExecution.triggeredByUserId,
				retryCount: cronJobExecution.retryCount,
				output: cronJobExecution.output,
				errorMessage: cronJobExecution.errorMessage,
				jobName: cronJob.name,
				jobDescription: cronJob.description
			})
			.from(cronJobExecution)
			.leftJoin(cronJob, eq(cronJobExecution.cronJobId, cronJob.id))
			.where(whereClause)
			.orderBy(...orderByClause)
			.limit(limit)
			.offset(offset),

		db.select({ count: count() }).from(cronJobExecution).where(whereClause)
	]);

	return {
		data: executions,
		count: totalCountResult[0].count,
		limit,
		offset,
		pageCount: Math.ceil(totalCountResult[0].count / limit),
	};
};

/**
 * Get a specific cron job execution by ID
 */
export const getCronJobExecutionById = async ({ id }: { id: string }) => {
	const db = getContextDB();
	const execution = await db
		.select({
			id: cronJobExecution.id,
			cronJobId: cronJobExecution.cronJobId,
			startedAt: cronJobExecution.startedAt,
			completedAt: cronJobExecution.completedAt,
			durationMs: cronJobExecution.durationMs,
			status: cronJobExecution.status,
			exitCode: cronJobExecution.exitCode,
			output: cronJobExecution.output,
			errorMessage: cronJobExecution.errorMessage,
			stackTrace: cronJobExecution.stackTrace,
			triggeredBy: cronJobExecution.triggeredBy,
			triggeredByUserId: cronJobExecution.triggeredByUserId,
			retryCount: cronJobExecution.retryCount,
			memoryUsageMb: cronJobExecution.memoryUsageMb,
			cpuUsagePercent: cronJobExecution.cpuUsagePercent,
			jobName: cronJob.name,
			jobDescription: cronJob.description,
			jobSchedule: cronJob.schedule
		})
		.from(cronJobExecution)
		.leftJoin(cronJob, eq(cronJobExecution.cronJobId, cronJob.id))
		.where(eq(cronJobExecution.id, id))
		.limit(1);

	return execution[0] || null;
};

/**
 * Delete old cron job executions based on retention policy
 */
export const cleanupOldExecutions = async ({
	retentionDays = 30,
}: {
	retentionDays?: number;
	maxExecutionsPerJob?: number;
}) => {
	const db = getContextDB();
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

	// Delete executions older than retention period
	const deletedByDate = await db
		.delete(cronJobExecution)
		.where(lte(cronJobExecution.startedAt, cutoffDate))
		.returning({ id: cronJobExecution.id });

	// TODO: For each job, keep only the most recent executions up to maxExecutionsPerJob
	// Skipping complex array operations for now
	const deletedByCount = 0;

	return {
		deletedByDate: deletedByDate.length,
		deletedByCount,
		totalDeleted: deletedByDate.length + deletedByCount
	};
};

/**
 * Get cron job execution statistics
 */
export const getCronJobStatistics = async ({ 
	days = 30,
	filter 
}: { 
	days?: number;
	filter?: Partial<CronExecutionFilterSchemaType>;
}) => {
	const db = getContextDB();
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);

	const conditions = [gte(cronJobExecution.startedAt, startDate)];

	// Apply additional filters if provided
	if (filter?.cronJobId) conditions.push(eq(cronJobExecution.cronJobId, filter.cronJobId));
	if (filter?.status) conditions.push(eq(cronJobExecution.status, filter.status));
	if (filter?.triggeredBy) conditions.push(eq(cronJobExecution.triggeredBy, filter.triggeredBy));

	const whereClause = and(...conditions);

	const stats = await db
		.select({
			status: cronJobExecution.status,
			count: count()
		})
		.from(cronJobExecution)
		.where(whereClause)
		.groupBy(cronJobExecution.status);

	const totalExecutions = stats.reduce((sum, stat) => sum + stat.count, 0);

	return {
		period: `Last ${days} days`,
		totalExecutions,
		statusBreakdown: stats,
		successRate:
			totalExecutions > 0
				? Math.round(
						((stats.find((s) => s.status === 'completed')?.count || 0) / totalExecutions) * 100
					)
				: 0
	};
};