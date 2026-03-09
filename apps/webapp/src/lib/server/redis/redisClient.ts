import IORedis from 'ioredis';

import { serverEnv } from '../serverEnv';

let redisClient: IORedis | null = null;

export const getRedisClient = () => {
	if (!redisClient) {
		redisClient = new IORedis({
			host: serverEnv.REDIS_HOST,
			port: serverEnv.REDIS_PORT,
			password: serverEnv.REDIS_PASSWORD,
			db: serverEnv.REDIS_DB,
			maxRetriesPerRequest: null,
			enableReadyCheck: false,
			lazyConnect: true
		});
	}

	return redisClient;
};

export const createRedisSubscriber = () => {
	return new IORedis({
		host: serverEnv.REDIS_HOST,
		port: serverEnv.REDIS_PORT,
		password: serverEnv.REDIS_PASSWORD,
		db: serverEnv.REDIS_DB,
		maxRetriesPerRequest: null,
		enableReadyCheck: false,
		lazyConnect: true
	});
};
