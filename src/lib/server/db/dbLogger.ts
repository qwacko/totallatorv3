import { nanoid } from 'nanoid';
import { logging } from '../logging';
import { db } from './db';
import { queryLogTable } from './postgres/schema';
import { tActions } from './actions/tActions';
import { serverEnv } from '../serverEnv';
import { PgRaw } from 'drizzle-orm/pg-core/query-builders/raw';

type QueryCache = {
	title?: string;
	query: string;
	time: Date;
	duration: number;
	params: unknown[];
	size: number;
};

type Query = {
	sql: string;
	params: unknown[];
};

export const dbLoggerCreate = ({
	localCacheSize,
	localCacheTimeout,
	storeQueries,
	disable = false,
	logError = (...args) => console.error(...args)
}: {
	localCacheSize: number;
	localCacheTimeout: number;
	disable?: boolean;
	storeQueries: (query: QueryCache[]) => Promise<void>;
	logError?: (message?: any, ...optionalParams: any[]) => void;
}) => {
	let timeoutId: NodeJS.Timeout;

	const queryInformation: QueryCache[] = [];

	const handleTimeout = () => {
		cleanup()
			.then(
				() => {
					timeoutId = setTimeout(handleTimeout, localCacheTimeout);
				},
				(err) => {
					logError('Error cleaning up queries', err);
					timeoutId = setTimeout(handleTimeout, localCacheTimeout);
				}
			)
			.catch((err) => {
				logError('Error cleaning up queries', err);
				timeoutId = setTimeout(handleTimeout, localCacheTimeout);
			});
	};

	const cleanup = async () => {
		if (queryInformation.length === 0) return;
		const queriesToStore = queryInformation.splice(0, queryInformation.length);
		await storeQueries(queriesToStore);
	};

	const executeRaw = async <T>(query: PgRaw<T>, title?: string) => {
		if (disable) {
			return query;
		}

		const startDate = new Date();
		const start = Date.now();
		const returnData = await query;

		const responseSize = JSON.stringify(returnData).length;
		const end = Date.now();
		const time = end - start;
		const queryInfo = query.getQuery();

		queryInformation.push({
			title,
			query: queryInfo.sql,
			time: startDate,
			duration: time,
			params: queryInfo.params,
			size: responseSize
		});

		if (queryInformation.length > localCacheSize) {
			cleanup();
		}

		// Perform cleanup action on timeout
		clearTimeout(timeoutId);
		timeoutId = setTimeout(cleanup, localCacheTimeout);

		return returnData;
	};

	const execute = async <T>(
		query: { execute: () => Promise<T>; toSQL: () => Query },
		title?: string
	) => {
		if (disable) {
			return query.execute();
		}
		const startDate = new Date();
		const start = Date.now();
		const returnData = await query.execute();

		const responseSize = returnData ? JSON.stringify(returnData).length : 0;
		const end = Date.now();
		const time = end - start;
		const queryInfo = query.toSQL();

		queryInformation.push({
			title,
			query: queryInfo.sql,
			time: startDate,
			duration: time,
			params: queryInfo.params,
			size: responseSize
		});

		if (queryInformation.length > localCacheSize) {
			cleanup();
		}

		// Perform cleanup action on timeout
		clearTimeout(timeoutId);
		timeoutId = setTimeout(cleanup, localCacheTimeout);

		return returnData;
	};

	return {
		triggerClean: cleanup,
		getQueries: () => queryInformation,
		execute,
		executeRaw
	};
};

const dbLogger = dbLoggerCreate({
	localCacheSize: serverEnv.DBLOG_CACHE_SIZE,
	localCacheTimeout: serverEnv.DBLOG_CACHE_TIMEOUT,
	disable: !serverEnv.DBLOG_ENABLE,
	storeQueries: async (queries) => {
		if (queries.length === 0) return;

		await db.insert(queryLogTable).values(
			queries.map((query) => ({
				id: nanoid(),
				title: query.title,
				query: query.query,
				time: query.time,
				duration: query.duration,
				params: JSON.stringify(query.params),
				size: query.size
			}))
		);

		await tActions.queryLog.tidy({ db });
	},
	logError: logging.error
});

export const dbExecuteLogger = dbLogger.execute;
export const dbExecuteRawLogger = dbLogger.executeRaw;
