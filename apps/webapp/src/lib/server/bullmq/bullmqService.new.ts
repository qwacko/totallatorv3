import { WorkerFactory } from '@totallator/bullmq';
import type { GlobalContext } from '@totallator/context';

import { serverEnv } from '../serverEnv';
// Import all job processors to register them
import './jobProcessors/testJob';

let workerFactory: WorkerFactory | null = null;

/**
 * Initialize BullMQ service
 */
export const initializeBullMQService = async (getContext: () => Promise<GlobalContext>) => {
	if (workerFactory) {
		return;
	}

	try {
		workerFactory = new WorkerFactory({
			redis: {
				host: serverEnv.REDIS_HOST,
				port: serverEnv.REDIS_PORT,
				password: serverEnv.REDIS_PASSWORD,
				db: serverEnv.REDIS_DB
			},
			workerId: 'webapp',
			concurrency: 2
		});

		// Create worker context factory
		const createContext = async () => {
			const globalContext = await getContext();
			return {
				logger: (category: string) => globalContext.logger(category as any),
				db: globalContext.db,
				serverEnv: globalContext.serverEnv,
				getGlobalContext: getContext
			};
		};

		// Create workers for different queues
		workerFactory.createWorker('cron', createContext);
		workerFactory.createWorker('background', createContext, { concurrency: 5 });

		console.log('[BullMQ] Service initialized successfully');
	} catch (error) {
		console.error('[BullMQ] Failed to initialize service:', error);
		throw error;
	}
};

/**
 * Get BullMQ service status
 */
export const getBullMQStatus = async () => {
	if (!workerFactory) {
		return { initialized: false };
	}

	try {
		const cronQueue = workerFactory.getQueue('cron');
		const backgroundQueue = workerFactory.getQueue('background');

		const [cronStatus, backgroundStatus] = await Promise.all([
			getQueueStats(cronQueue),
			getQueueStats(backgroundQueue)
		]);

		return {
			initialized: true,
			queues: {
				cron: cronStatus,
				background: backgroundStatus
			}
		};
	} catch (error) {
		return {
			initialized: true,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
};

async function getQueueStats(queue: any) {
	const [waiting, active, completed, failed] = await Promise.all([
		queue.getWaiting(),
		queue.getActive(),
		queue.getCompleted(),
		queue.getFailed()
	]);

	return {
		waiting: waiting.length,
		active: active.length,
		completed: completed.length,
		failed: failed.length
	};
}

/**
 * Add job to queue
 */
export const addJob = async (queueName: string, type: string, data: any, options?: any) => {
	if (!workerFactory) {
		throw new Error('BullMQ service not initialized');
	}

	return await workerFactory.addJob(queueName, type, data, options);
};

/**
 * Shutdown BullMQ service
 */
export const shutdownBullMQService = async () => {
	if (workerFactory) {
		await workerFactory.shutdown();
		workerFactory = null;
		console.log('[BullMQ] Service shutdown successfully');
	}
};
