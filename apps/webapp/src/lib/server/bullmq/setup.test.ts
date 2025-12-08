import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { addJob, getQueueStatus } from './setup';
import { registerTestJob } from './testJob';

describe('BullMQ Integration', () => {
	beforeEach(async () => {
		// Register test job processor
		registerTestJob();
	});

	afterEach(async () => {
		// Clean up any test jobs
		// Note: This would require Redis connection cleanup in a real test
	});

	it('should add a test job to the queue', async () => {
		const job = await addJob('test-log-job', { message: 'Test message' });

		expect(job).toBeDefined();
		expect(job.id).toBeDefined();
		expect(job.name).toBe('test-log-job');
	});

	it('should get queue status', async () => {
		const status = await getQueueStatus();

		expect(status).toHaveProperty('waiting');
		expect(status).toHaveProperty('active');
		expect(status).toHaveProperty('completed');
		expect(status).toHaveProperty('failed');

		expect(typeof status.waiting).toBe('number');
		expect(typeof status.active).toBe('number');
		expect(typeof status.completed).toBe('number');
		expect(typeof status.failed).toBe('number');
	});
});
