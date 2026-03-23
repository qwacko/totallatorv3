import { nanoid } from 'nanoid';

import type {
	RealtimeEntityType,
	RealtimeEventMap,
	RealtimeLongProcess,
	RealtimeSnapshot,
	RealtimeWriteLock
} from '@totallator/shared';

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

const toRealtimeWriteLock = (lock: LongProcessLock | null): RealtimeWriteLock => ({
	enabled: serverEnv.ENABLE_GLOBAL_WRITE_LOCK,
	locked: lock !== null,
	jobId: lock?.jobId,
	processType: lock?.type,
	reason: lock?.reason,
	startedAt: lock?.startedAt,
	expiresAt: lock?.expiresAt,
	owner: lock?.owner
});

const toRealtimeLongProcess = (state: LongProcessJobState): RealtimeLongProcess => ({
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
	const redis = getRedisClient();
	await redis.publish(EVENTS_CHANNEL, JSON.stringify({ event, payload, timestamp: getNow() }));
};

export const publishRealtimeEvent = publishEvent;

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

	await publishEvent('write_lock.changed', toRealtimeWriteLock(lock));
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
	await publishEvent('write_lock.changed', toRealtimeWriteLock(updatedLock));

	return updatedLock;
};

export const releaseWriteLock = async (jobId: string) => {
	const redis = getRedisClient();
	const currentLock = await getWriteLock();

	if (!currentLock || currentLock.jobId !== jobId) {
		return false;
	}

	await redis.del(WRITE_LOCK_KEY);
	await publishEvent('write_lock.changed', toRealtimeWriteLock(null));
	return true;
};

export const startLongJob = async (params: {
	type: string;
	entityType?: RealtimeEntityType;
	entityId?: string;
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
		label: params.message || params.type,
		message: params.message,
		startedAt: now,
		updatedAt: now,
		metadata: {
			...params.metadata,
			entityType: params.entityType,
			entityId: params.entityId
		}
	};

	const redis = getRedisClient();
	await redis.set(getJobStateKey(jobState.jobId), JSON.stringify(jobState), 'EX', 60 * 60 * 24);
	await publishEvent('long_process.started', toRealtimeLongProcess(jobState));

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
		label: existing.label,
		message: params.message || existing.message,
		metadata: {
			...existing.metadata,
			...(params.metadata || {})
		},
		updatedAt: getNow()
	};

	await redis.set(key, JSON.stringify(updated), 'EX', 60 * 60 * 24);
	await publishEvent('long_process.progress', toRealtimeLongProcess(updated));

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
		label: existing.label,
		message: params.message || existing.message,
		error: params.error,
		updatedAt: getNow(),
		completedAt: getNow()
	};

	await redis.set(key, JSON.stringify(finalState), 'EX', 60 * 60 * 24);
	await publishEvent(
		params.status === 'completed' ? 'long_process.completed' : 'long_process.failed',
		toRealtimeLongProcess(finalState)
	);
	await releaseWriteLock(jobId);

	return finalState;
};

export const getLongJobState = async (jobId: string) => {
	const redis = getRedisClient();
	const raw = await redis.get(getJobStateKey(jobId));
	return parseJson<LongProcessJobState>(raw);
};

const getJobStateKeys = async (limit = 200) => {
	const redis = getRedisClient();
	let cursor = '0';
	const keys: string[] = [];

	do {
		const [nextCursor, batch] = await redis.scan(
			cursor,
			'MATCH',
			`${JOB_STATE_KEY_PREFIX}*:state`,
			'COUNT',
			100
		);
		cursor = nextCursor;
		keys.push(...batch);
		if (keys.length >= limit) {
			break;
		}
	} while (cursor !== '0');

	return keys.slice(0, limit);
};

export const getLatestLongJobState = async () => {
	const redis = getRedisClient();
	const keys = await getJobStateKeys();
	if (keys.length === 0) {
		return null;
	}

	const states = (await redis.mget(...keys))
		.map((value) => parseJson<LongProcessJobState>(value))
		.filter((value): value is LongProcessJobState => value !== null);

	if (states.length === 0) {
		return null;
	}

	states.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	return states[0];
};

export const getLongProcessSnapshot = async (): Promise<RealtimeSnapshot> => {
	const [lock, latestJob] = await Promise.all([getWriteLock(), getLatestLongJobState()]);
	const activeJob = lock ? ((await getLongJobState(lock.jobId)) ?? latestJob) : null;

	return {
		writeLock: toRealtimeWriteLock(lock),
		activeLongProcesses: activeJob ? [toRealtimeLongProcess(activeJob)] : [],
		latestLongProcess: latestJob ? toRealtimeLongProcess(latestJob) : null
	};
};
