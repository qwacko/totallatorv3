import type { Job } from 'bullmq';

import type { GlobalContext } from '@totallator/context';

import { addJob, registerJobProcessor } from './setup';

// Job type constant
export const TEST_JOB_TYPE = 'test-log-job';

/**
 * Test job processor - logs a message every time it runs
 */
export const testJobProcessor = async (job: Job<any>, context: GlobalContext) => {
	const timestamp = new Date().toISOString();
	const message = `BullMQ test job executed at ${timestamp}`;

	context.logger('cron').info({
		title: message,
		code: 'BULLMQ_0001',
		jobId: job.id,
		jobData: job.data
	});

	console.log(`[BullMQ Test] ${message}`);

	return { success: true, timestamp };
};

/**
 * Register the test job processor
 */
export const registerTestJob = () => {
	registerJobProcessor(TEST_JOB_TYPE, testJobProcessor);
};

/**
 * Schedule the test job to run every minute
 */
export const scheduleTestJob = async () => {
	await addJob(
		TEST_JOB_TYPE,
		{ message: 'This is a test job that runs every minute' },
		{
			repeat: { pattern: '* * * * *' }, // Every minute
			jobId: 'test-job-every-minute'
		}
	);

	console.log('[BullMQ] Test job scheduled to run every minute');
};
