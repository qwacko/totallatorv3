import IORedis from 'ioredis';
import { nanoid } from 'nanoid';

import { workerEnv } from '../serverEnv';

const WRITE_LOCK_KEY = 'totallator:lock:global-write';
const EVENTS_CHANNEL = 'totallator:events:jobs';
const JOB_STATE_KEY_PREFIX = 'totallator:job:';

export type WorkerLongProcessJobState = {
	jobId: string;
	type: string;
	status: 'running' | 'completed' | 'failed' | 'cancelled';
	progress: number;
	message?: string;
	startedAt: string;
	updatedAt: string;
	completedAt?: string;
	metadata?: Record<string, unknown>;
	error?: string;
};

const redis = new IORedis({
	host: workerEnv.REDIS_HOST,
	port: workerEnv.REDIS_PORT,
	password: workerEnv.REDIS_PASSWORD,
	db: workerEnv.REDIS_DB,
	maxRetriesPerRequest: null,
	enableReadyCheck: false,
	lazyConnect: true
});

const getNow = () => new Date().toISOString();
const getLockTTLSeconds = () => Math.max(workerEnv.LONG_PROCESS_LOCK_TTL_SECONDS, 15);
const getJobStateKey = (jobId: string) => `${JOB_STATE_KEY_PREFIX}${jobId}:state`;

class LongProcessTimeoutError extends Error {
	constructor(type: string, timeoutMs: number) {
		super(`Long process "${type}" exceeded timeout of ${timeoutMs}ms`);
		this.name = 'LongProcessTimeoutError';
	}
}

const DEFAULT_MAX_RUNTIME_MS = 60 * 60 * 1000;

const publishEvent = async (event: string, payload: unknown) => {
	await redis.publish(
		EVENTS_CHANNEL,
		JSON.stringify({
			event,
			payload,
			timestamp: getNow()
		})
	);
};

const acquireWriteLock = async (jobId: string, type: string, reason?: string) => {
	const now = Date.now();
	const ttlSeconds = getLockTTLSeconds();
	const lock = {
		jobId,
		type,
		startedAt: new Date(now).toISOString(),
		expiresAt: new Date(now + ttlSeconds * 1000).toISOString(),
		reason,
		owner: 'worker'
	};

	const result = await redis.set(WRITE_LOCK_KEY, JSON.stringify(lock), 'EX', ttlSeconds, 'NX');
	if (result !== 'OK') {
		return null;
	}

	await publishEvent('lock-acquired', lock);
	return lock;
};

const refreshWriteLock = async (jobId: string, type: string, reason?: string) => {
	const now = Date.now();
	const ttlSeconds = getLockTTLSeconds();
	const lock = {
		jobId,
		type,
		startedAt: new Date(now).toISOString(),
		expiresAt: new Date(now + ttlSeconds * 1000).toISOString(),
		reason,
		owner: 'worker'
	};

	await redis.set(WRITE_LOCK_KEY, JSON.stringify(lock), 'EX', ttlSeconds);
	await publishEvent('lock-heartbeat', lock);
};

const releaseWriteLock = async (jobId: string) => {
	const raw = await redis.get(WRITE_LOCK_KEY);
	if (!raw) {
		return;
	}

	try {
		const lock = JSON.parse(raw);
		if (lock.jobId !== jobId) {
			return;
		}
		await redis.del(WRITE_LOCK_KEY);
		await publishEvent('lock-released', lock);
	} catch {
		await redis.del(WRITE_LOCK_KEY);
	}
};

export const runTrackedLongProcess = async <T>(params: {
	type: string;
	message: string;
	metadata?: Record<string, unknown>;
	reason?: string;
	maxRuntimeMs?: number;
	run: (context: {
		jobId: string;
		reportProgress: (params: {
			progress: number;
			message?: string;
			metadata?: Record<string, unknown>;
		}) => Promise<void>;
	}) => Promise<T>;
}) => {
	const now = getNow();
	const jobId = nanoid();

	if (workerEnv.ENABLE_GLOBAL_WRITE_LOCK) {
		const lock = await acquireWriteLock(jobId, params.type, params.reason);
		if (!lock) {
			throw new Error('Global write lock already active');
		}
	}

	const state: WorkerLongProcessJobState = {
		jobId,
		type: params.type,
		status: 'running',
		progress: 0,
		message: params.message,
		startedAt: now,
		updatedAt: now,
		metadata: params.metadata
	};

	await redis.set(getJobStateKey(jobId), JSON.stringify(state), 'EX', 60 * 60 * 24);
	await publishEvent('progress', state);

	const reportProgress = async (update: {
		progress: number;
		message?: string;
		metadata?: Record<string, unknown>;
	}) => {
		const updated: WorkerLongProcessJobState = {
			...state,
			status: 'running',
			progress: Math.max(0, Math.min(100, update.progress)),
			message: update.message ?? state.message,
			metadata: update.metadata ?? state.metadata,
			updatedAt: getNow()
		};

		await redis.set(getJobStateKey(jobId), JSON.stringify(updated), 'EX', 60 * 60 * 24);
		await publishEvent('progress', updated);
	};

	let heartbeat: ReturnType<typeof setInterval> | null = null;
	if (workerEnv.ENABLE_GLOBAL_WRITE_LOCK) {
		heartbeat = setInterval(() => {
			void refreshWriteLock(jobId, params.type, params.reason);
		}, 10_000);
	}

	const maxRuntimeMs = Math.max(params.maxRuntimeMs ?? DEFAULT_MAX_RUNTIME_MS, 1_000);
	let timeoutRef: ReturnType<typeof setTimeout> | null = null;

	try {
		const runPromise = params.run({ jobId, reportProgress });
		const timeoutPromise = new Promise<never>((_, reject) => {
			timeoutRef = setTimeout(() => {
				reject(new LongProcessTimeoutError(params.type, maxRuntimeMs));
			}, maxRuntimeMs);
		});

		const result = await Promise.race([runPromise, timeoutPromise]);
		const completed: WorkerLongProcessJobState = {
			...state,
			status: 'completed',
			progress: 100,
			message: `${params.message} completed`,
			updatedAt: getNow(),
			completedAt: getNow()
		};
		await redis.set(getJobStateKey(jobId), JSON.stringify(completed), 'EX', 60 * 60 * 24);
		await publishEvent('completed', completed);
		return result;
	} catch (error) {
		const failed: WorkerLongProcessJobState = {
			...state,
			status: 'failed',
			message: `${params.message} failed`,
			error: error instanceof Error ? error.message : 'Unknown error',
			updatedAt: getNow(),
			completedAt: getNow()
		};
		await redis.set(getJobStateKey(jobId), JSON.stringify(failed), 'EX', 60 * 60 * 24);
		await publishEvent('failed', failed);
		throw error;
	} finally {
		if (timeoutRef) {
			clearTimeout(timeoutRef);
		}
		if (heartbeat) {
			clearInterval(heartbeat);
		}
		if (workerEnv.ENABLE_GLOBAL_WRITE_LOCK) {
			await releaseWriteLock(jobId);
		}
	}
};
