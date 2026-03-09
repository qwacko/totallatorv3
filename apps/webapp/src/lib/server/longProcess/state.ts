import { nanoid } from 'nanoid';

import { getRedisClient } from '../redis/redisClient';
import { serverEnv } from '../serverEnv';

const WRITE_LOCK_KEY = 'totallator:lock:global-write';
const EVENTS_CHANNEL = 'totallator:events:jobs';
const JOB_STATE_KEY_PREFIX = 'totallator:job:';

export type LongProcessLock = {
	jobId: string;
	type: string;
	startedAt: string;
	owner?: string;
	expiresAt: string;
	reason?: string;
};

export type LongProcessJobState = {
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

export type LongProcessEventMap = {
	'lock-acquired': LongProcessLock;
	'lock-heartbeat': LongProcessLock;
	progress: LongProcessJobState;
	completed: LongProcessJobState;
	failed: LongProcessJobState;
	'lock-released': LongProcessLock;
};

export type LongProcessEvent<TEvent extends keyof LongProcessEventMap = keyof LongProcessEventMap> =
	{
		event: TEvent;
		payload: LongProcessEventMap[TEvent];
		timestamp: string;
	};

const getNow = () => new Date().toISOString();

const getLockTTLSeconds = () => Math.max(serverEnv.LONG_PROCESS_LOCK_TTL_SECONDS, 15);

const getJobStateKey = (jobId: string) => `${JOB_STATE_KEY_PREFIX}${jobId}:state`;

const parseJson = <T>(value: string | null): T | null => {
	if (!value) {
		return null;
	}

	try {
		return JSON.parse(value) as T;
	} catch {
		return null;
	}
};

const publishEvent = async <TEvent extends keyof LongProcessEventMap>(
	event: TEvent,
	payload: LongProcessEventMap[TEvent]
) => {
	const redis = getRedisClient();
	const eventPayload: LongProcessEvent<TEvent> = {
		event,
		payload,
		timestamp: getNow()
	};
	await redis.publish(EVENTS_CHANNEL, JSON.stringify(eventPayload));
};

export const getLongProcessEventsChannel = () => EVENTS_CHANNEL;

export const isWriteLockEnabled = () => serverEnv.ENABLE_GLOBAL_WRITE_LOCK;

export const getWriteLock = async () => {
	try {
		const redis = getRedisClient();
		const raw = await redis.get(WRITE_LOCK_KEY);
		return parseJson<LongProcessLock>(raw);
	} catch {
		return null;
	}
};

export const isWriteLocked = async () => {
	if (!isWriteLockEnabled()) {
		return false;
	}

	try {
		return (await getWriteLock()) !== null;
	} catch {
		return false;
	}
};

export const acquireWriteLock = async (params: {
	type: string;
	reason?: string;
	owner?: string;
	jobId?: string;
}) => {
	const redis = getRedisClient();
	const now = Date.now();
	const ttlSeconds = getLockTTLSeconds();
	const jobId = params.jobId || nanoid();
	const lock: LongProcessLock = {
		jobId,
		type: params.type,
		startedAt: new Date(now).toISOString(),
		expiresAt: new Date(now + ttlSeconds * 1000).toISOString(),
		owner: params.owner,
		reason: params.reason
	};

	const result = await redis.set(WRITE_LOCK_KEY, JSON.stringify(lock), 'EX', ttlSeconds, 'NX');
	if (result !== 'OK') {
		return null;
	}

	await publishEvent('lock-acquired', lock);
	return lock;
};

export const refreshWriteLock = async (jobId: string) => {
	const redis = getRedisClient();
	const currentLock = await getWriteLock();

	if (!currentLock || currentLock.jobId !== jobId) {
		return null;
	}

	const now = Date.now();
	const ttlSeconds = getLockTTLSeconds();
	const updatedLock: LongProcessLock = {
		...currentLock,
		expiresAt: new Date(now + ttlSeconds * 1000).toISOString()
	};

	await redis.set(WRITE_LOCK_KEY, JSON.stringify(updatedLock), 'EX', ttlSeconds);
	await publishEvent('lock-heartbeat', updatedLock);

	return updatedLock;
};

export const releaseWriteLock = async (jobId: string) => {
	const redis = getRedisClient();
	const currentLock = await getWriteLock();

	if (!currentLock || currentLock.jobId !== jobId) {
		return false;
	}

	await redis.del(WRITE_LOCK_KEY);
	await publishEvent('lock-released', currentLock);
	return true;
};

export const startLongJob = async (params: {
	type: string;
	message?: string;
	metadata?: Record<string, unknown>;
	owner?: string;
	reason?: string;
}) => {
	const lock = await acquireWriteLock({
		type: params.type,
		owner: params.owner,
		reason: params.reason
	});
	if (!lock) {
		throw new Error('Global write lock already active');
	}

	const now = getNow();
	const jobState: LongProcessJobState = {
		jobId: lock.jobId,
		type: params.type,
		status: 'running',
		progress: 0,
		message: params.message,
		startedAt: now,
		updatedAt: now,
		metadata: params.metadata
	};

	const redis = getRedisClient();
	await redis.set(getJobStateKey(jobState.jobId), JSON.stringify(jobState), 'EX', 60 * 60 * 24);
	await publishEvent('progress', jobState);

	return jobState;
};

export const updateLongJob = async (
	jobId: string,
	params: {
		progress: number;
		message?: string;
		metadata?: Record<string, unknown>;
	}
) => {
	const redis = getRedisClient();
	const key = getJobStateKey(jobId);
	const existing = parseJson<LongProcessJobState>(await redis.get(key));
	if (!existing) {
		return null;
	}

	const updated: LongProcessJobState = {
		...existing,
		status: 'running',
		progress: Math.max(0, Math.min(100, params.progress)),
		message: params.message || existing.message,
		metadata: params.metadata || existing.metadata,
		updatedAt: getNow()
	};

	await redis.set(key, JSON.stringify(updated), 'EX', 60 * 60 * 24);
	await publishEvent('progress', updated);

	return updated;
};

export const finishLongJob = async (
	jobId: string,
	params: {
		status: 'completed' | 'failed' | 'cancelled';
		message?: string;
		error?: string;
	}
) => {
	const redis = getRedisClient();
	const key = getJobStateKey(jobId);
	const existing = parseJson<LongProcessJobState>(await redis.get(key));
	if (!existing) {
		return null;
	}

	const finalState: LongProcessJobState = {
		...existing,
		status: params.status,
		progress: params.status === 'completed' ? 100 : existing.progress,
		message: params.message || existing.message,
		error: params.error,
		updatedAt: getNow(),
		completedAt: getNow()
	};

	await redis.set(key, JSON.stringify(finalState), 'EX', 60 * 60 * 24);
	await publishEvent(params.status === 'completed' ? 'completed' : 'failed', finalState);
	await releaseWriteLock(jobId);

	return finalState;
};

export const getLongJobState = async (jobId: string) => {
	const redis = getRedisClient();
	const raw = await redis.get(getJobStateKey(jobId));
	return parseJson<LongProcessJobState>(raw);
};
