import { workerRegistry } from '@totallator/bullmq';
import type { TypedJobProcessor } from '@totallator/bullmq';

import type { WorkerJobMap } from '../jobContracts';

export const testJobProcessor: TypedJobProcessor<WorkerJobMap, 'test-log-job'> = async (
	job,
	context
) => {
	const timestamp = new Date().toISOString();

	context.logger('worker').info({
		title: 'BullMQ test job executed',
		code: 'BULLMQ_WORKER_0001',
		timestamp,
		jobId: job.id,
		jobData: job.data
	});

	return {
		success: true,
		data: { timestamp }
	};
};

workerRegistry.registerTyped<WorkerJobMap, 'test-log-job'>('test-log-job', testJobProcessor, {
	defaultRepeat: '* * * * *',
	attempts: 3
});
