import type { GlobalContext } from '@totallator/context';

import { getQueueStatus, initializeWorker, shutdownWorker } from './setup';
import { registerTestJob, scheduleTestJob } from './testJob';

let isInitialized = false;

/**
 * Initialize BullMQ service
 */
export const initializeBullMQService = async (getContext: () => Promise<GlobalContext>) => {
	console.log('[BullMQ] Initializing service...');
	if (isInitialized) {
		return;
	}

	try {
		// Initialize the worker
		initializeWorker(getContext);

		// Register job processors
		registerTestJob();

		// Schedule initial jobs
		await scheduleTestJob();

		isInitialized = true;
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
	if (!isInitialized) {
		return { initialized: false };
	}

	try {
		const queueStatus = await getQueueStatus();
		return {
			initialized: true,
			queues: {
				cron: queueStatus
			}
		};
	} catch (error) {
		console.error('[BullMQ] Failed to get status:', error);
		return {
			initialized: true,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
};

/**
 * Shutdown BullMQ service
 */
export const shutdownBullMQService = async () => {
	if (!isInitialized) {
		return;
	}

	try {
		await shutdownWorker();
		isInitialized = false;
		console.log('[BullMQ] Service shutdown successfully');
	} catch (error) {
		console.error('[BullMQ] Failed to shutdown service:', error);
	}
};
