import IORedis from 'ioredis';
import { nanoid } from 'nanoid';

import type {
	RealtimeEntityType,
	RealtimeEventMap,
	RealtimeLongProcess,
	RealtimeWriteLock
} from '@totallator/shared';

import { workerEnv } from '../serverEnv';

const WRITE_LOCK_KEY = 'totallator:lock:global-write';
const EVENTS_CHANNEL = 'totallator:events:jobs';
const JOB_STATE_KEY_PREFIX = 'totallator:job:';

export type WorkerLongProcessJobState = {
	jobId: string;
	type: string;
	status: 'running' | 'completed' | 'failed' | 'cancelled';
	progress: number;
	label: string;
	message?: string;
	startedAt: string;
	updatedAt: string;
	completedAt?: string;
	metadata?: Record<string, unknown> & {
		entityType?: RealtimeEntityType;
		entityId?: string;
	};
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

const toRealtimeWriteLock = (lock: {
	jobId: string;
	type: string;
	startedAt: string;
	expiresAt: string;
	reason?: string;
	owner?: string;
}): RealtimeWriteLock => ({
	enabled: workerEnv.ENABLE_GLOBAL_WRITE_LOCK,
	locked: true,
	jobId: lock.jobId,
	processType: lock.type,
	reason: lock.reason,
	startedAt: lock.startedAt,
	expiresAt: lock.expiresAt,
	owner: lock.owner
});

const toRealtimeLongProcess = (state: WorkerLongProcessJobState): RealtimeLongProcess => ({
	jobId: state.jobId,
	processType: state.type,
	status: state.status,
	progress: state.progress,
	label: state.label,
	message: state.message,
	entityType: state.metadata?.entityType,
	entityId: state.metadata?.entityId,
	startedAt: state.startedAt,
	updatedAt: state.updatedAt,
	completedAt: state.completedAt,
	error: state.error
});

const publishEvent = async <TEvent extends keyof RealtimeEventMap>(
	event: TEvent,
	payload: RealtimeEventMap[TEvent]
) => {
	await redis.publish(
		EVENTS_CHANNEL,
		JSON.stringify({
			event,
			payload,
			timestamp: getNow()
		})
	);
};

export const publishRealtimeEvent = publishEvent;

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

	await publishEvent('write_lock.changed', toRealtimeWriteLock(lock));
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
	await publishEvent('write_lock.changed', toRealtimeWriteLock(lock));
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
		await publishEvent('write_lock.changed', {
			enabled: workerEnv.ENABLE_GLOBAL_WRITE_LOCK,
			locked: false
		});
	} catch {
		await redis.del(WRITE_LOCK_KEY);
	}
};

export const runTrackedLongProcess = async <T>(params: {
	type: string;
	entityType?: RealtimeEntityType;
	entityId?: string;
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
		label: params.message,
		message: params.message,
		startedAt: now,
		updatedAt: now,
		metadata: {
			...params.metadata,
			entityType: params.entityType,
			entityId: params.entityId
		}
	};

	await redis.set(getJobStateKey(jobId), JSON.stringify(state), 'EX', 60 * 60 * 24);
	await publishEvent('long_process.started', toRealtimeLongProcess(state));

	const reportProgress = async (update: {
		progress: number;
		message?: string;
		metadata?: Record<string, unknown>;
	}) => {
		const updated: WorkerLongProcessJobState = {
			...state,
			status: 'running',
			progress: Math.max(0, Math.min(100, update.progress)),
			label: state.label,
			message: update.message ?? state.message,
			metadata: {
				...state.metadata,
				...(update.metadata ?? {})
			},
			updatedAt: getNow()
		};

		await redis.set(getJobStateKey(jobId), JSON.stringify(updated), 'EX', 60 * 60 * 24);
		await publishEvent('long_process.progress', toRealtimeLongProcess(updated));
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
			label: state.label,
			message: `${params.message} completed`,
			updatedAt: getNow(),
			completedAt: getNow()
		};
		await redis.set(getJobStateKey(jobId), JSON.stringify(completed), 'EX', 60 * 60 * 24);
		await publishEvent('long_process.completed', toRealtimeLongProcess(completed));
		return result;
	} catch (error) {
		const failed: WorkerLongProcessJobState = {
			...state,
			status: 'failed',
			label: state.label,
			message: `${params.message} failed`,
			error: error instanceof Error ? error.message : 'Unknown error',
			updatedAt: getNow(),
			completedAt: getNow()
		};
		await redis.set(getJobStateKey(jobId), JSON.stringify(failed), 'EX', 60 * 60 * 24);
		await publishEvent('long_process.failed', toRealtimeLongProcess(failed));
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
