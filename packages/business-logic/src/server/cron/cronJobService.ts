import { eq, desc, and, gte, lte } from 'drizzle-orm';
import schedule, { Job } from 'node-schedule';
import type { CoreDBType } from '@totallator/database';
import { cronJob, cronJobExecution, keyValueTable } from '@totallator/database';
import type { GlobalContext } from '@totallator/context';
import { runWithContext } from '@totallator/context';

import type {
	CronJobDefinition,
	CronJobExecutionFilter,
	CronJobExecutionStatus,
	CronJobResult
} from './types';
import { cronJobDefinitions } from './cronJobDefinitions';

/**
 * Service for managing cron jobs and their executions.
 * Handles scheduling, execution tracking, and manual triggering.
 */
export class CronJobService {
	private scheduledJobs: Map<string, Job> = new Map();
	private runningJobs: Map<string, Promise<void>> = new Map();

	constructor(
		private db: CoreDBType,
		private getGlobalContext: () => GlobalContext
	) {}

	/**
	 * Initialize the cron service by syncing job definitions to database
	 * and starting the scheduler
	 */
	async initialize(): Promise<void> {
		await this.syncJobDefinitionsToDatabase();
		await this.startScheduler();
	}

	/**
	 * Gracefully shutdown the cron service
	 */
	async shutdown(): Promise<void> {
		// Cancel all scheduled jobs
		for (const [, job] of this.scheduledJobs) {
			job.cancel();
		}
		this.scheduledJobs.clear();

		// Wait for running jobs to complete (with timeout)
		const runningJobPromises = Array.from(this.runningJobs.values());
		if (runningJobPromises.length > 0) {
			await Promise.allSettled(runningJobPromises);
		}
		this.runningJobs.clear();

		// Use node-schedule's graceful shutdown
		await schedule.gracefulShutdown();
	}

	/**
	 * Sync job definitions from code to database
	 */
	private async syncJobDefinitionsToDatabase(): Promise<void> {
		try {
			// Test if the cronJob table exists by running a simple query
			await this.db.select().from(cronJob).limit(1);
		} catch (error) {
			console.warn(
				'Cron tables not yet available, skipping job sync. This is normal during initial startup.'
			);
			return;
		}

		for (const jobDef of cronJobDefinitions) {
			try {
				// Replace environment variable placeholders
				const schedule = this.resolveScheduleExpression(jobDef.schedule);

				const existingJob = await this.db
					.select()
					.from(cronJob)
					.where(eq(cronJob.name, jobDef.name))
					.limit(1);

				if (existingJob.length === 0) {
					// Create new job record
					await this.db.insert(cronJob).values({
						name: jobDef.name,
						description: jobDef.description,
						schedule: schedule,
						isEnabled: jobDef.isEnabled,
						timeoutMs: jobDef.timeoutMs,
						maxRetries: jobDef.maxRetries,
						createdBy: 'system',
						lastModifiedBy: 'system'
					});
				} else {
					// Update existing job record (but preserve user-modified settings)
					await this.db
						.update(cronJob)
						.set({
							description: jobDef.description,
							schedule: schedule,
							timeoutMs: jobDef.timeoutMs,
							maxRetries: jobDef.maxRetries,
							updatedAt: new Date(),
							lastModifiedBy: 'system'
						})
						.where(eq(cronJob.name, jobDef.name));
				}
			} catch (error) {
				console.error(`Failed to sync job definition ${jobDef.name}:`, error);
			}
		}
	}

	/**
	 * Start the scheduler and schedule all enabled jobs
	 */
	private async startScheduler(): Promise<void> {
		let enabledJobs;
		try {
			enabledJobs = await this.db.select().from(cronJob).where(eq(cronJob.isEnabled, true));

			console.log(`Found ${enabledJobs.length} enabled cron jobs to schedule`);
		} catch (error) {
			console.warn('Could not load cron jobs from database, skipping scheduler start:', error);
			return;
		}

		for (const jobRecord of enabledJobs) {
			const jobDefinition = cronJobDefinitions.find((def) => def.name === jobRecord.name);
			if (!jobDefinition) {
				console.warn(`No definition found for cron job: ${jobRecord.name}`);
				continue;
			}

			try {
				const scheduledJob = schedule.scheduleJob(jobRecord.name, jobRecord.schedule, () =>
					this.executeJob(jobDefinition, jobRecord.id, 'scheduler')
				);

				if (scheduledJob) {
					this.scheduledJobs.set(jobRecord.id, scheduledJob);
					console.log(`Scheduled cron job: ${jobRecord.name} with schedule: ${jobRecord.schedule}`);
				}
			} catch (error) {
				console.error(`Failed to schedule job ${jobRecord.name}:`, error);
			}
		}
	}

	/**
	 * Manually trigger a cron job execution
	 */
	async triggerJob(
		jobId: string,
		triggeredByUserId?: string
	): Promise<{ success: boolean; executionId: string; message?: string }> {
		try {
			const jobRecord = await this.db.select().from(cronJob).where(eq(cronJob.id, jobId)).limit(1);

			if (jobRecord.length === 0) {
				return {
					success: false,
					executionId: '',
					message: 'Cron job not found'
				};
			}

			const jobDefinition = cronJobDefinitions.find((def) => def.name === jobRecord[0].name);
			if (!jobDefinition) {
				return {
					success: false,
					executionId: '',
					message: 'Job definition not found'
				};
			}

			const executionId = await this.executeJob(jobDefinition, jobId, 'manual', triggeredByUserId);

			return {
				success: true,
				executionId,
				message: 'Job triggered successfully'
			};
		} catch (error) {
			return {
				success: false,
				executionId: '',
				message: `Failed to trigger job: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		}
	}

	/**
	 * Execute a cron job and track its execution
	 */
	private async executeJob(
		jobDefinition: CronJobDefinition,
		cronJobId: string,
		triggeredBy: 'scheduler' | 'manual' | 'api',
		triggeredByUserId?: string,
		retryCount: number = 0
	): Promise<string> {
		const executionId = crypto.randomUUID();
		const startTime = new Date();

		// Check if job is already running (prevent concurrent executions)
		if (this.runningJobs.has(cronJobId)) {
			console.warn(`Cron job ${jobDefinition.name} is already running, skipping execution`);
			return executionId;
		}

		// Check if a backup restore is in progress
		const isRestoreActive = await this.hasActiveBackupRestore();
		if (isRestoreActive) {
			console.log(`Skipping cron job ${jobDefinition.name} execution - backup restore in progress`);

			// Create a skipped execution record
			await this.db.insert(cronJobExecution).values({
				id: executionId,
				cronJobId,
				startedAt: startTime,
				completedAt: new Date(),
				durationMs: 0,
				status: 'skipped',
				triggeredBy,
				triggeredByUserId,
				retryCount,
				output: JSON.stringify({ reason: 'Backup restore in progress' }),
				errorMessage: 'Execution skipped due to active backup restore'
			});

			return executionId;
		}

		// Create execution record
		await this.db.insert(cronJobExecution).values({
			id: executionId,
			cronJobId,
			startedAt: startTime,
			status: 'running',
			triggeredBy,
			triggeredByUserId,
			retryCount
		});

		const executionPromise = this.runJobExecution(
			jobDefinition,
			cronJobId,
			executionId,
			startTime,
			triggeredBy,
			triggeredByUserId,
			retryCount
		);

		this.runningJobs.set(cronJobId, executionPromise);

		try {
			await executionPromise;
		} finally {
			this.runningJobs.delete(cronJobId);
		}

		return executionId;
	}

	/**
	 * Run the actual job execution with timeout and error handling
	 */
	private async runJobExecution(
		jobDefinition: CronJobDefinition,
		cronJobId: string,
		executionId: string,
		startTime: Date,
		triggeredBy: 'scheduler' | 'manual' | 'api',
		triggeredByUserId?: string,
		retryCount: number = 0
	): Promise<void> {
		const context = this.getGlobalContext();
		const requestContext = this.createCronRequestContext(jobDefinition.name);

		let result: CronJobResult;
		let status: CronJobExecutionStatus = 'running';
		let errorMessage: string | undefined;
		let stackTrace: string | undefined;

		try {
			// Set up timeout
			const timeoutPromise = new Promise<CronJobResult>((_, reject) => {
				setTimeout(() => reject(new Error('Job execution timeout')), jobDefinition.timeoutMs);
			});

			// Execute the job with timeout
			const jobPromise = runWithContext(context, requestContext, async () => {
				return await jobDefinition.job(context);
			});

			result = await Promise.race([jobPromise, timeoutPromise]);
			status = result.success ? 'completed' : 'failed';

			if (!result.success && result.message) {
				errorMessage = result.message;
			}
		} catch (error) {
			status =
				error instanceof Error && error.message === 'Job execution timeout' ? 'timeout' : 'failed';
			errorMessage = error instanceof Error ? error.message : 'Unknown error';
			stackTrace = error instanceof Error ? error.stack : undefined;

			result = {
				success: false,
				message: errorMessage,
				metrics: {
					executionTimeMs: Date.now() - startTime.getTime()
				}
			};
		}

		const completedAt = new Date();
		const durationMs = completedAt.getTime() - startTime.getTime();

		// Update execution record
		await this.db
			.update(cronJobExecution)
			.set({
				completedAt,
				durationMs,
				status,
				output: result.success ? JSON.stringify(result.data || {}) : undefined,
				errorMessage,
				stackTrace,
				memoryUsageMb: result.metrics?.memoryUsageMb
			})
			.where(eq(cronJobExecution.id, executionId));

		// Log execution result
		if (result.success) {
			if (true) {
				context.logger('cron').debug({
					title: `Cron job ${jobDefinition.name} completed successfully`,
					code: 'CRON_0000',
					executionId,
					durationMs,
					triggeredBy,
					...result.data
				});
			}
		} else {
			context.logger('cron').error({
				code: 'CRON_0002',
				title: `Cron job ${jobDefinition.name} failed`,
				executionId,
				durationMs,
				triggeredBy,
				error: errorMessage,
				retryCount
			});

			// Handle retries
			if (retryCount < jobDefinition.maxRetries) {
				context.logger('cron').info({
					code: 'CRON_0001',
					title: `Retrying cron job ${jobDefinition.name} (attempt ${retryCount + 2})`
				});

				// Schedule retry with exponential backoff
				const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
				setTimeout(() => {
					this.executeJob(jobDefinition, cronJobId, triggeredBy, triggeredByUserId, retryCount + 1);
				}, retryDelay);
			}
		}
	}

	/**
	 * Create a minimal request context for cron jobs
	 */
	private createCronRequestContext(jobName: string) {
		return {
			user: undefined,
			session: undefined,
			requestId: crypto.randomUUID(),
			startTime: Date.now(),
			event: {
				request: new Request(`http://localhost/cron/${jobName}`),
				locals: {},
				getClientAddress: () => '127.0.0.1'
			},
			userAgent: `Cron-Job-${jobName}`,
			ip: '127.0.0.1'
		};
	}

	/**
	 * Check if a backup restore is currently in progress
	 * Uses the service's database connection to avoid context issues
	 */
	private async hasActiveBackupRestore(): Promise<boolean> {
		try {
			// Query the backup_restore_progress key-value directly
			const progressResult = await this.db
				.select({ value: keyValueTable.value })
				.from(keyValueTable)
				.where(eq(keyValueTable.key, 'backup_restore_progress'))
				.limit(1);

			if (progressResult.length === 0) {
				return false;
			}

			const progressData = JSON.parse(progressResult[0].value);

			if (!progressData || !progressData.phase) {
				return false;
			}

			// Check if the restore is in progress (not completed, failed, or cancelled)
			return !['completed', 'failed', 'cancelled'].includes(progressData.phase);
		} catch (error) {
			console.warn('Failed to check backup restore status in cron service:', error);
			// Return false if we can't check - allow cron jobs to proceed
			return false;
		}
	}

	/**
	 * Resolve environment variable placeholders in schedule expressions
	 */
	private resolveScheduleExpression(schedule: string): string {
		return schedule
			.replace('${BACKUP_SCHEDULE}', process.env.BACKUP_SCHEDULE || '0 0 * * *')
			.replace(
				'${AUTOMATIC_FILTER_SCHEDULE}',
				process.env.AUTOMATIC_FILTER_SCHEDULE || '*/15 * * * *'
			)
			.replace('${LLM_REVIEW_SCHEDULE}', process.env.LLM_REVIEW_SCHEDULE || '*/5 * * * *');
	}

	/**
	 * Get cron job execution history with filtering
	 */
	async getExecutionHistory(filter: CronJobExecutionFilter = {}): Promise<{
		executions: Array<any>;
		total: number;
	}> {
		const conditions = [];

		if (filter.cronJobId) {
			conditions.push(eq(cronJobExecution.cronJobId, filter.cronJobId));
		}
		if (filter.status) {
			conditions.push(eq(cronJobExecution.status, filter.status));
		}
		if (filter.triggeredBy) {
			conditions.push(eq(cronJobExecution.triggeredBy, filter.triggeredBy));
		}
		if (filter.startedAfter) {
			conditions.push(gte(cronJobExecution.startedAt, filter.startedAfter));
		}
		if (filter.startedBefore) {
			conditions.push(lte(cronJobExecution.startedAt, filter.startedBefore));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const [executions, totalCountResult] = await Promise.all([
			this.db
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
					jobName: cronJob.name
				})
				.from(cronJobExecution)
				.leftJoin(cronJob, eq(cronJobExecution.cronJobId, cronJob.id))
				.where(whereClause)
				.orderBy(desc(cronJobExecution.startedAt))
				.limit(filter.limit || 50)
				.offset(filter.offset || 0),

			this.db.select({ count: cronJobExecution.id }).from(cronJobExecution).where(whereClause)
		]);

		return {
			executions,
			total: totalCountResult.length
		};
	}

	/**
	 * Get all cron jobs with their latest execution status
	 */
	async getAllJobs(): Promise<Array<any>> {
		return await this.db
			.select({
				id: cronJob.id,
				name: cronJob.name,
				description: cronJob.description,
				schedule: cronJob.schedule,
				isEnabled: cronJob.isEnabled,
				timeoutMs: cronJob.timeoutMs,
				maxRetries: cronJob.maxRetries,
				createdAt: cronJob.createdAt,
				updatedAt: cronJob.updatedAt
			})
			.from(cronJob)
			.orderBy(cronJob.name);
	}

	/**
	 * Enable or disable a cron job
	 */
	async updateJobStatus(jobId: string, isEnabled: boolean, modifiedBy: string): Promise<void> {
		await this.db
			.update(cronJob)
			.set({
				isEnabled,
				updatedAt: new Date(),
				lastModifiedBy: modifiedBy
			})
			.where(eq(cronJob.id, jobId));

		// Update scheduler
		if (isEnabled) {
			// Re-schedule if enabled
			const jobRecord = await this.db.select().from(cronJob).where(eq(cronJob.id, jobId)).limit(1);

			if (jobRecord.length > 0) {
				const jobDefinition = cronJobDefinitions.find((def) => def.name === jobRecord[0].name);
				if (jobDefinition) {
					const scheduledJob = schedule.scheduleJob(jobRecord[0].name, jobRecord[0].schedule, () =>
						this.executeJob(jobDefinition, jobRecord[0].id, 'scheduler')
					);
					if (scheduledJob) {
						this.scheduledJobs.set(jobId, scheduledJob);
					}
				}
			}
		} else {
			// Cancel if disabled
			const job = this.scheduledJobs.get(jobId);
			if (job) {
				job.cancel();
				this.scheduledJobs.delete(jobId);
			}
		}
	}
}
