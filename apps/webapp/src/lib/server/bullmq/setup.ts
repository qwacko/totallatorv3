import { Job, Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

import type { GlobalContext } from '@totallator/context';

import { serverEnv } from '../serverEnv';

// Connection configuration
const connection = new IORedis({
	host: serverEnv.REDIS_HOST,
	port: serverEnv.REDIS_PORT,
	password: serverEnv.REDIS_PASSWORD,
	db: serverEnv.REDIS_DB,
	maxRetriesPerRequest: null, // BullMQ requires this to be null
	enableReadyCheck: false,
	lazyConnect: true
});

// Queue names
export const QUEUE_NAMES = {
	CRON: 'cron-jobs',
	DEFAULT: 'default'
} as const;

// Create queues
export const cronQueue = new Queue(QUEUE_NAMES.CRON, { connection });

// Note: QueueScheduler is deprecated in BullMQ v5+, using built-in delayed jobs

// Worker instance
let worker: Worker | null = null;

// Job processors interface
export interface JobData {
	type: string;
	data: any;
}

// Job processor type
export type JobProcessor = (job: Job<any>, context: GlobalContext) => Promise<any>;

// Registry for job processors
const jobProcessors = new Map<string, JobProcessor>();

/**
 * Register a job processor
 */
export const registerJobProcessor = (jobType: string, processor: JobProcessor) => {
	jobProcessors.set(jobType, processor);
};

/**
 * Initialize the BullMQ worker
 */
export const initializeWorker = (getContext: () => Promise<GlobalContext>) => {
	if (worker) {
		return worker;
	}

	worker = new Worker(
		QUEUE_NAMES.CRON,
		async (job: Job<any>) => {
			const { type } = job.data as JobData;
			const processor = jobProcessors.get(type);

			if (!processor) {
				throw new Error(`No processor found for job type: ${type}`);
			}

			try {
				const context = await getContext();
				await processor(job, context);
			} catch (error) {
				console.error(`Error processing job ${type}:`, error);
				throw error;
			}
		},
		{ connection }
	);

	worker.on('completed', (job) => {
		console.log(`Job ${job.id} (${job.data.type}) completed`);
	});

	worker.on('failed', (job, err) => {
		console.error(`Job ${job?.id} (${job?.data?.type}) failed:`, err);
	});

	worker.on('error', (err) => {
		console.error('Worker error:', err);
	});

	return worker;
};

/**
 * Gracefully shutdown the worker
 */
export const shutdownWorker = async () => {
	if (worker) {
		await worker.close();
		worker = null;
	}

	if (cronQueue) {
		await cronQueue.close();
	}

	if (connection) {
		await connection.quit();
	}
};

/**
 * Add a job to the queue
 */
export const addJob = async (
	type: string,
	data: any,
	options?: {
		delay?: number;
		repeat?: { pattern: string };
		// Add other BullMQ job options as needed
		[key: string]: any;
	}
) => {
	return await cronQueue.add(
		type,
		{ type, data },
		{
			removeOnComplete: 100,
			removeOnFail: 50,
			attempts: 3,
			backoff: {
				type: 'exponential',
				delay: 2000
			},
			...options
		}
	);
};

/**
 * Get queue status
 */
export const getQueueStatus = async () => {
	const [waiting, active, completed, failed] = await Promise.all([
		cronQueue.getWaiting(),
		cronQueue.getActive(),
		cronQueue.getCompleted(),
		cronQueue.getFailed()
	]);

	return {
		waiting: waiting.length,
		active: active.length,
		completed: completed.length,
		failed: failed.length
	};
};
