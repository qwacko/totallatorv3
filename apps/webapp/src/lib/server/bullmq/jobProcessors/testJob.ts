// apps/webapp/src/lib/server/bullmq/jobProcessors/testJob.ts
import { workerRegistry } from '@totallator/bullmq';
import type { JobProcessor } from '@totallator/bullmq';

export const testJobProcessor: JobProcessor = async (job, context) => {
	const timestamp = new Date().toISOString();
	const message = `BullMQ test job executed at ${timestamp}`;

	context.logger('cron').info({
		title: message,
		code: 'BULLMQ_0001',
		jobId: job.id,
		jobData: job.data
	});

	console.log(`[BullMQ Test] ${message}`);

	return {
		success: true,
		data: { timestamp },
		metrics: {
			executionTimeMs: Date.now() - job.processedOn!
		}
	};
};

// Register the job processor
workerRegistry.register('test-log-job', testJobProcessor, {
	defaultRepeat: '* * * * *', // Every minute
	attempts: 3
});
