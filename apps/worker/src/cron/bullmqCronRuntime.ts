import type { Queue } from 'bullmq';
import { eq } from 'drizzle-orm';

import { cronJobDefinitions } from '@totallator/business-logic/server/cron/cronJobDefinitions';
import { cronJob, cronJobExecution } from '@totallator/database';

import { globalContext, standaloneContext } from '../context/workerContext';

type TriggeredBy = 'scheduler' | 'manual' | 'api';

type ExecuteCronPayload = {
	cronJobId: string;
	triggeredBy?: TriggeredBy;
	triggeredByUserId?: string;
	retryCount?: number;
};

let cronQueue: Queue | null = null;

const resolveScheduleExpression = (schedule: string, env: Record<string, string | undefined>) => {
	return schedule.replace(/\$\{([^}]+)\}/g, (_match, envVar) => env[envVar] || '* * * * *');
};

export const setCronQueue = (queue: Queue) => {
	cronQueue = queue;
};

const getRepeatJobId = (cronJobId: string) => `cron-execute:${cronJobId}`;

export const syncCronDefinitionsAndSchedules = async () => {
	if (!cronQueue) {
		throw new Error('Cron queue not initialized');
	}

	const context = await globalContext();
	const db = context.db;
	const env = process.env;

	for (const jobDef of cronJobDefinitions) {
		const schedule = resolveScheduleExpression(jobDef.schedule, env);
		const existing = await db.select().from(cronJob).where(eq(cronJob.name, jobDef.name)).limit(1);

		if (existing.length === 0) {
			await db.insert(cronJob).values({
				name: jobDef.name,
				description: jobDef.description,
				schedule,
				isEnabled: jobDef.isEnabled,
				timeoutMs: jobDef.timeoutMs,
				maxRetries: jobDef.maxRetries,
				createdBy: 'system',
				lastModifiedBy: 'system'
			});
		} else {
			await db
				.update(cronJob)
				.set({
					description: jobDef.description,
					schedule,
					timeoutMs: jobDef.timeoutMs,
					maxRetries: jobDef.maxRetries,
					updatedAt: new Date(),
					lastModifiedBy: 'system'
				})
				.where(eq(cronJob.id, existing[0].id));
		}
	}

	const enabledJobs = await db.select().from(cronJob).where(eq(cronJob.isEnabled, true));
	const desiredRepeatJobs = new Map(
		enabledJobs.map((job) => [getRepeatJobId(job.id), job.schedule])
	);
	const repeatableJobs = await cronQueue.getRepeatableJobs();

	for (const repeatableJob of repeatableJobs) {
		if (repeatableJob.name !== 'cron-execute') {
			continue;
		}

		const expectedPattern = desiredRepeatJobs.get(repeatableJob.id);
		if (!expectedPattern || expectedPattern !== repeatableJob.pattern) {
			await cronQueue.removeRepeatableByKey(repeatableJob.key);
		}
	}

	for (const enabled of enabledJobs) {
		await cronQueue.add(
			'cron-execute',
			{ cronJobId: enabled.id, triggeredBy: 'scheduler' },
			{
				jobId: getRepeatJobId(enabled.id),
				repeat: { pattern: enabled.schedule },
				removeOnComplete: 100,
				removeOnFail: 100
			}
		);
	}
};

export const setCronJobEnabled = async (jobId: string, isEnabled: boolean, modifiedBy: string) => {
	const context = await globalContext();
	await context.db
		.update(cronJob)
		.set({ isEnabled, lastModifiedBy: modifiedBy, updatedAt: new Date() })
		.where(eq(cronJob.id, jobId));

	await syncCronDefinitionsAndSchedules();
};

export const executeCronJobById = async (payload: ExecuteCronPayload) => {
	const context = await globalContext();
	const db = context.db;

	const [jobRecord] = await db
		.select()
		.from(cronJob)
		.where(eq(cronJob.id, payload.cronJobId))
		.limit(1);
	if (!jobRecord) {
		return { success: false, message: 'Cron job not found' };
	}

	const jobDefinition = cronJobDefinitions.find((def) => def.name === jobRecord.name);
	if (!jobDefinition) {
		return { success: false, message: `Definition not found for ${jobRecord.name}` };
	}

	const startTime = Date.now();
	const [execution] = await db
		.insert(cronJobExecution)
		.values({
			cronJobId: jobRecord.id,
			status: 'running',
			triggeredBy: payload.triggeredBy || 'manual',
			triggeredByUserId: payload.triggeredByUserId,
			retryCount: payload.retryCount || 0
		})
		.returning({ id: cronJobExecution.id });

	try {
		const result = await standaloneContext(
			{
				requestId: `worker-cron-${execution.id}`,
				routeId: `worker/cron/${jobRecord.name}`,
				url: `/worker/cron/${jobRecord.name}`,
				method: 'CRON',
				startTime,
				ip: '127.0.0.1'
			},
			async (runContext) => {
				return await jobDefinition.job(runContext.global as any);
			}
		);

		await db
			.update(cronJobExecution)
			.set({
				status: result?.success === false ? 'failed' : 'completed',
				output: result?.message || null,
				completedAt: new Date(),
				durationMs: Date.now() - startTime,
				errorMessage: result?.success === false ? result?.message || 'Job failed' : null
			})
			.where(eq(cronJobExecution.id, execution.id));

		if (result?.success === false) {
			throw new Error(result?.message || 'Job returned unsuccessful result');
		}

		return { success: true, executionId: execution.id };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		await db
			.update(cronJobExecution)
			.set({
				status: 'failed',
				errorMessage,
				output: errorMessage,
				completedAt: new Date(),
				durationMs: Date.now() - startTime
			})
			.where(eq(cronJobExecution.id, execution.id));

		const currentRetry = payload.retryCount || 0;
		if (currentRetry < jobRecord.maxRetries && cronQueue) {
			await cronQueue.add(
				'cron-execute',
				{
					cronJobId: payload.cronJobId,
					triggeredBy: payload.triggeredBy || 'manual',
					triggeredByUserId: payload.triggeredByUserId,
					retryCount: currentRetry + 1
				},
				{ delay: 5000 }
			);
		}

		return { success: false, executionId: execution.id, message: errorMessage };
	}
};
