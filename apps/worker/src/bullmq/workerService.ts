import { WorkerFactory } from '@totallator/bullmq';
import {
	clearInProgressBackupRestores,
	initializeEventCallbacks
} from '@totallator/business-logic';

import { globalContext, standaloneContext } from '../context/workerContext';
import {
	executeCronJobById,
	setCronQueue,
	syncCronDefinitionsAndSchedules
} from '../cron/bullmqCronRuntime';
import { workerEnv } from '../serverEnv';
import { WORKER_QUEUES } from './jobContracts';
import type { WorkerJobMap } from './jobContracts';
import './jobProcessors/cronControl';
import './jobProcessors/longRunning';
import './jobProcessors/testJob';

const createLogger = (category: string) => {
	return {
		info: (data: unknown) => console.log(`[${category}]`, data),
		error: (data: unknown) => console.error(`[${category}]`, data),
		warn: (data: unknown) => console.warn(`[${category}]`, data),
		debug: (data: unknown) => console.debug(`[${category}]`, data)
	};
};

let workerFactory: WorkerFactory | null = null;
let cronSyncTimer: ReturnType<typeof setInterval> | null = null;

export const startWorkerService = async () => {
	if (workerFactory) {
		return workerFactory;
	}

	workerFactory = new WorkerFactory({
		redis: {
			host: workerEnv.REDIS_HOST,
			port: workerEnv.REDIS_PORT,
			password: workerEnv.REDIS_PASSWORD,
			db: workerEnv.REDIS_DB
		},
		workerId: 'totallator-worker',
		concurrency: 2
	});

	await standaloneContext(
		{
			requestId: 'worker-startup',
			routeId: 'internal/worker-startup',
			url: '/internal/worker-startup',
			method: 'INIT',
			startTime: Date.now(),
			ip: '127.0.0.1'
		},
		async () => {
			initializeEventCallbacks();
			await clearInProgressBackupRestores();
		}
	);

	const contextFactory = async () => {
		const context = await globalContext();

		return {
			logger: createLogger,
			db: context.db,
			serverEnv: workerEnv,
			getGlobalContext: async () => context
		};
	};

	workerFactory.createWorker(WORKER_QUEUES.CRON, contextFactory, { concurrency: 2 });
	workerFactory.createWorker(WORKER_QUEUES.BACKGROUND, contextFactory, { concurrency: 5 });
	workerFactory.createWorker(WORKER_QUEUES.LONG_RUNNING, contextFactory, { concurrency: 1 });

	const cronQueue = workerFactory.getQueue(WORKER_QUEUES.CRON);
	setCronQueue(cronQueue);
	await syncCronDefinitionsAndSchedules();

	// Processor for scheduled cron execution jobs
	workerFactory.registerTypedProcessor<WorkerJobMap, 'cron-execute'>(
		'cron-execute',
		async (job) => {
			const payload = job.data.data;
			const result = await executeCronJobById(payload);
			return { success: result.success, data: result };
		}
	);

	cronSyncTimer = setInterval(() => {
		void syncCronDefinitionsAndSchedules();
	}, 60_000);

	console.log('[Worker] BullMQ workers started');
	return workerFactory;
};

export const stopWorkerService = async () => {
	if (cronSyncTimer) {
		clearInterval(cronSyncTimer);
		cronSyncTimer = null;
	}

	if (!workerFactory) {
		return;
	}

	await workerFactory.shutdown();
	workerFactory = null;
	console.log('[Worker] BullMQ workers stopped');
};
