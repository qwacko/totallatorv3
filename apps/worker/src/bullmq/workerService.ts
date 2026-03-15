import { WorkerFactory } from '@totallator/bullmq';
import {
	clearInProgressBackupRestores,
	initializeEventCallbacks
} from '@totallator/business-logic';
import { withRootContext, withSpan } from '@totallator/telemetry';

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

let workerFactory: WorkerFactory | null = null;
let cronSyncTimer: ReturnType<typeof setInterval> | null = null;

const wrapWorkerLogger = (loggerFactory: Awaited<ReturnType<typeof globalContext>>['logger']) => {
	return (category: string) => {
		const logger = loggerFactory(category as never);

		const normalizeData = (level: 'info' | 'warn' | 'error' | 'debug', data: unknown) => {
			if (data && typeof data === 'object' && 'code' in data && 'title' in data) {
				return data as { code: string; title: string; [key: string]: unknown };
			}

			return {
				code: `BULLMQ_${level.toUpperCase()}`,
				title: typeof data === 'string' ? data : `BullMQ ${category} ${level}`,
				payload: data
			};
		};

		return {
			info: (data: unknown) => logger.info(normalizeData('info', data)),
			error: (data: unknown) => logger.error(normalizeData('error', data)),
			warn: (data: unknown) => logger.warn(normalizeData('warn', data)),
			debug: (data: unknown) => logger.debug(normalizeData('debug', data))
		};
	};
};

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

	await withSpan(
		'worker.startup.initialize-context',
		async () => {
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
		},
		{ tracerName: '@totallator/worker' }
	);

	const contextFactory = async () => {
		const context = await globalContext();

		return {
			logger: wrapWorkerLogger(context.logger),
			db: context.db,
			serverEnv: workerEnv,
			getGlobalContext: async () => context
		};
	};

	withRootContext(() => {
		workerFactory!.createWorker(WORKER_QUEUES.CRON, contextFactory, { concurrency: 2 });
		workerFactory!.createWorker(WORKER_QUEUES.BACKGROUND, contextFactory, { concurrency: 5 });
		workerFactory!.createWorker(WORKER_QUEUES.LONG_RUNNING, contextFactory, { concurrency: 1 });
	});

	// Processor for scheduled cron execution jobs
	workerFactory.registerTypedProcessor<WorkerJobMap, 'cron-execute'>('cron-execute', async (job) => {
		const payload = job.data.data;
		const result = await executeCronJobById(payload);
		return { success: result.success, data: result };
	});

	const cronQueue = workerFactory.getQueue(WORKER_QUEUES.CRON);
	setCronQueue(cronQueue);

	await withSpan(
		'worker.startup.sync-cron',
		async () => {
			await syncCronDefinitionsAndSchedules();
		},
		{ tracerName: '@totallator/worker' }
	);

	cronSyncTimer = withRootContext(() =>
		setInterval(() => {
			void withSpan(
				'worker.cron.sync-tick',
				async () => {
					await syncCronDefinitionsAndSchedules();
				},
				{ tracerName: '@totallator/worker' }
			);
		}, 60_000)
	);

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
