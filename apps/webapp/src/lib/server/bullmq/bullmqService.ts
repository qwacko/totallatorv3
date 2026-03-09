import { WorkerFactory } from '@totallator/bullmq';
import type { DefaultJobMap } from '@totallator/bullmq';

import { serverEnv } from '../serverEnv';
import { WEBAPP_QUEUES } from './jobContracts';

let workerFactory: WorkerFactory | null = null;

const getWorkerFactory = () => {
	if (!workerFactory) {
		workerFactory = new WorkerFactory({
			redis: {
				host: serverEnv.REDIS_HOST,
				port: serverEnv.REDIS_PORT,
				password: serverEnv.REDIS_PASSWORD,
				db: serverEnv.REDIS_DB
			},
			workerId: 'webapp-client',
			concurrency: 1
		});
	}

	return workerFactory;
};

export const getBullMQStatus = async () => {
	try {
		const factory = getWorkerFactory();
		const [cronStatus, backgroundStatus, longRunningStatus] = await Promise.all([
			getQueueStats(factory.getQueue(WEBAPP_QUEUES.CRON)),
			getQueueStats(factory.getQueue(WEBAPP_QUEUES.BACKGROUND)),
			getQueueStats(factory.getQueue(WEBAPP_QUEUES.LONG_RUNNING))
		]);

		return {
			initialized: true,
			queues: {
				cron: cronStatus,
				background: backgroundStatus,
				longRunning: longRunningStatus
			}
		};
	} catch (error) {
		return {
			initialized: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
};

async function getQueueStats(queue: any) {
	const [waiting, active, completed, failed] = await Promise.all([
		queue.getWaitingCount(),
		queue.getActiveCount(),
		queue.getCompletedCount(),
		queue.getFailedCount()
	]);

	return {
		waiting,
		active,
		completed,
		failed
	};
}

export const addJob = async (queueName: string, type: string, data: unknown, options?: any) => {
	const factory = getWorkerFactory();
	return await factory.addJob(queueName, type, data, options);
};

export const addTypedJob = async <TJobMap extends DefaultJobMap, K extends keyof TJobMap & string>(
	queueName: string,
	type: K,
	data: TJobMap[K]['data'],
	options?: any
) => {
	const factory = getWorkerFactory();
	return await factory.addTypedJob<TJobMap, K>(queueName, type, data, options);
};

export const shutdownBullMQService = async () => {
	if (workerFactory) {
		await workerFactory.shutdown();
		workerFactory = null;
	}
};
