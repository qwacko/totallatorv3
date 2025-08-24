import { and, asc, count, desc, eq } from 'drizzle-orm';

import { getContextDB } from '@totallator/context';
import { cronJob, cronJobExecution } from '@totallator/database';
import type { CronJobFilterSchemaType, UpdateCronJobSchemaType } from '@totallator/shared';

/**
 * Actions for managing cron jobs.
 * Provides CRUD operations for cron job management.
 */

/**
 * Get all cron jobs with their latest execution information
 */
export const getAllCronJobs = async (filter?: CronJobFilterSchemaType) => {
	const db = getContextDB();

	console.log('Filter:', filter);

	// Build where conditions (simplified for basic functionality)
	const conditions = [];
	if (filter?.id) conditions.push(eq(cronJob.id, filter.id));
	if (filter?.name) conditions.push(eq(cronJob.name, filter.name));
	if (filter?.isEnabled !== undefined) conditions.push(eq(cronJob.isEnabled, filter.isEnabled));
	if (filter?.schedule) conditions.push(eq(cronJob.schedule, filter.schedule));
	// TODO: Add array-based filtering when needed

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	// Build order by (simplified)
	const orderByClause = [asc(cronJob.name)]; // Default ordering by name

	// Apply pagination
	const limit = filter?.pageSize || 25;
	const offset = (filter?.page || 0) * limit;

	const jobs = await db
		.select({
			id: cronJob.id,
			name: cronJob.name,
			description: cronJob.description,
			schedule: cronJob.schedule,
			isEnabled: cronJob.isEnabled,
			timeoutMs: cronJob.timeoutMs,
			maxRetries: cronJob.maxRetries,
			createdAt: cronJob.createdAt,
			updatedAt: cronJob.updatedAt,
			createdBy: cronJob.createdBy,
			lastModifiedBy: cronJob.lastModifiedBy
		})
		.from(cronJob)
		.where(whereClause)
		.orderBy(...orderByClause)
		.limit(limit)
		.offset(offset);

	// Get total count
	const totalCountResult = await db.select({ count: count() }).from(cronJob).where(whereClause);

	// Get latest execution and statistics for each job
	const jobsWithExecutions = await Promise.all(
		jobs.map(async (job) => {
			const latestExecution = await db
				.select({
					id: cronJobExecution.id,
					startedAt: cronJobExecution.startedAt,
					completedAt: cronJobExecution.completedAt,
					durationMs: cronJobExecution.durationMs,
					status: cronJobExecution.status,
					triggeredBy: cronJobExecution.triggeredBy,
					retryCount: cronJobExecution.retryCount,
					errorMessage: cronJobExecution.errorMessage
				})
				.from(cronJobExecution)
				.where(eq(cronJobExecution.cronJobId, job.id))
				.orderBy(desc(cronJobExecution.startedAt))
				.limit(1);

			// Get execution statistics
			const [successCount, failCount, totalCount] = await Promise.all([
				db
					.select({ count: count() })
					.from(cronJobExecution)
					.where(
						and(eq(cronJobExecution.cronJobId, job.id), eq(cronJobExecution.status, 'completed'))
					),
				db
					.select({ count: count() })
					.from(cronJobExecution)
					.where(
						and(eq(cronJobExecution.cronJobId, job.id), eq(cronJobExecution.status, 'failed'))
					),
				db
					.select({ count: count() })
					.from(cronJobExecution)
					.where(eq(cronJobExecution.cronJobId, job.id))
			]);

			return {
				...job,
				latestExecution: latestExecution[0] || null,
				statistics: {
					totalExecutions: totalCount[0].count,
					successfulExecutions: successCount[0].count,
					failedExecutions: failCount[0].count,
					successRate:
						totalCount[0].count > 0
							? Math.round((successCount[0].count / totalCount[0].count) * 100)
							: 0
				}
			};
		})
	);

	return {
		data: jobsWithExecutions,
		count: totalCountResult[0].count,
		limit,
		offset,
		pageCount: Math.ceil(totalCountResult[0].count / limit)
	};
};

/**
 * Get a specific cron job by ID with detailed information
 */
export const getCronJobById = async ({ id }: { id: string }) => {
	const db = getContextDB();

	const job = await db.select().from(cronJob).where(eq(cronJob.id, id)).limit(1);

	if (job.length === 0) {
		return null;
	}

	// Get recent executions (last 20)
	const recentExecutions = await db
		.select({
			id: cronJobExecution.id,
			startedAt: cronJobExecution.startedAt,
			completedAt: cronJobExecution.completedAt,
			durationMs: cronJobExecution.durationMs,
			status: cronJobExecution.status,
			triggeredBy: cronJobExecution.triggeredBy,
			triggeredByUserId: cronJobExecution.triggeredByUserId,
			retryCount: cronJobExecution.retryCount,
			output: cronJobExecution.output,
			errorMessage: cronJobExecution.errorMessage
		})
		.from(cronJobExecution)
		.where(eq(cronJobExecution.cronJobId, id))
		.orderBy(desc(cronJobExecution.startedAt))
		.limit(20);

	// Get execution statistics
	const [successCount, failCount, timeoutCount, totalCount] = await Promise.all([
		db
			.select({ count: count() })
			.from(cronJobExecution)
			.where(and(eq(cronJobExecution.cronJobId, id), eq(cronJobExecution.status, 'completed'))),
		db
			.select({ count: count() })
			.from(cronJobExecution)
			.where(and(eq(cronJobExecution.cronJobId, id), eq(cronJobExecution.status, 'failed'))),
		db
			.select({ count: count() })
			.from(cronJobExecution)
			.where(and(eq(cronJobExecution.cronJobId, id), eq(cronJobExecution.status, 'timeout'))),
		db.select({ count: count() }).from(cronJobExecution).where(eq(cronJobExecution.cronJobId, id))
	]);

	return {
		...job[0],
		recentExecutions,
		statistics: {
			totalExecutions: totalCount[0].count,
			successfulExecutions: successCount[0].count,
			failedExecutions: failCount[0].count,
			timeoutExecutions: timeoutCount[0].count,
			successRate:
				totalCount[0].count > 0
					? Math.round((successCount[0].count / totalCount[0].count) * 100)
					: 0
		}
	};
};

/**
 * Update cron job enabled status
 */
export const updateCronJobStatus = async ({
	id,
	isEnabled,
	modifiedBy
}: {
	id: string;
	isEnabled: boolean;
	modifiedBy: string;
}) => {
	const db = getContextDB();

	const result = await db
		.update(cronJob)
		.set({
			isEnabled,
			updatedAt: new Date(),
			lastModifiedBy: modifiedBy
		})
		.where(eq(cronJob.id, id))
		.returning();

	return result[0] || null;
};

/**
 * Update cron job configuration
 */
export const updateCronJobConfig = async (config: UpdateCronJobSchemaType) => {
	const db = getContextDB();
	const updates: any = {
		updatedAt: new Date(),
		lastModifiedBy: config.modifiedBy
	};

	if (config.name !== undefined) updates.name = config.name;
	if (config.description !== undefined) updates.description = config.description;
	if (config.schedule !== undefined) updates.schedule = config.schedule;
	if (config.timeoutMs !== undefined) updates.timeoutMs = config.timeoutMs;
	if (config.maxRetries !== undefined) updates.maxRetries = config.maxRetries;
	if (config.isEnabled !== undefined) updates.isEnabled = config.isEnabled;

	const result = await db.update(cronJob).set(updates).where(eq(cronJob.id, config.id)).returning();

	return result[0] || null;
};

/**
 * Create or update a cron job (used by sync process)
 */
export const upsertCronJob = async (jobData: {
	id: string;
	name: string;
	description?: string;
	schedule: string;
	isEnabled?: boolean;
	timeoutMs?: number;
	maxRetries?: number;
	createdBy: string;
}) => {
	const db = getContextDB();

	// Check if job exists
	const existingJob = await db.select().from(cronJob).where(eq(cronJob.id, jobData.id)).limit(1);

	if (existingJob.length > 0) {
		// Update only if needed, preserve user settings
		const updates: any = {
			name: jobData.name,
			updatedAt: new Date()
		};

		// Only update these if they've changed from defaults
		if (jobData.description !== undefined) updates.description = jobData.description;
		if (jobData.schedule !== existingJob[0].schedule) updates.schedule = jobData.schedule;
		if (jobData.timeoutMs !== undefined && jobData.timeoutMs !== existingJob[0].timeoutMs) {
			updates.timeoutMs = jobData.timeoutMs;
		}
		if (jobData.maxRetries !== undefined && jobData.maxRetries !== existingJob[0].maxRetries) {
			updates.maxRetries = jobData.maxRetries;
		}

		const result = await db
			.update(cronJob)
			.set(updates)
			.where(eq(cronJob.id, jobData.id))
			.returning();

		return result[0];
	} else {
		// Create new job
		const result = await db
			.insert(cronJob)
			.values({
				id: jobData.id,
				name: jobData.name,
				description: jobData.description,
				schedule: jobData.schedule,
				isEnabled: jobData.isEnabled ?? true,
				timeoutMs: jobData.timeoutMs ?? 120000,
				maxRetries: jobData.maxRetries ?? 0,
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: jobData.createdBy,
				lastModifiedBy: jobData.createdBy
			})
			.returning();

		return result[0];
	}
};
