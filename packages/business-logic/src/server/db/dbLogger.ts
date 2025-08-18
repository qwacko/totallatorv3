import { nanoid } from 'nanoid';
import { queryLogTable } from '@totallator/database';
import { queryLogActions } from '@/actions/queryLogActions';
import { PgRaw } from 'drizzle-orm/pg-core/query-builders/raw';
import { GlobalContext } from '@totallator/context';

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

type ExecuteFunction = <T>(
	query: { execute: () => Promise<T>; toSQL: () => Query },
	title?: string
) => Promise<T>;

type ExecuteRawFunction = <T>(query: PgRaw<T>, title?: string) => Promise<T>;

export const dbLoggerCreate = ({
	localCacheSize,
	localCacheTimeout,
	storeQueries,
	disable = () => false,
	logError = (...args) => console.error(...args)
}: {
	localCacheSize: () => number;
	localCacheTimeout: () => number;
	disable?: () => boolean;
	storeQueries: (query: QueryCache[]) => Promise<void>;
	logError?: (message?: any, ...optionalParams: any[]) => void;
}) => {
	let timeoutId: NodeJS.Timeout;

	const queryInformation: QueryCache[] = [];

	const handleTimeout = () => {
		cleanup()
			.then(
				() => {
					timeoutId = setTimeout(handleTimeout, localCacheTimeout());
				},
				(err) => {
					logError('Error cleaning up queries', err);
					timeoutId = setTimeout(handleTimeout, localCacheTimeout());
				}
			)
			.catch((err) => {
				logError('Error cleaning up queries', err);
				timeoutId = setTimeout(handleTimeout, localCacheTimeout());
			});
	};

	const cleanup = async () => {
		if (queryInformation.length === 0) return;
		const queriesToStore = queryInformation.splice(0, queryInformation.length);
		await storeQueries(queriesToStore);
	};

	const executeRaw: ExecuteRawFunction = async <T>(query: PgRaw<T>, title?: string): Promise<T> => {
		if (disable()) {
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

		if (queryInformation.length > localCacheSize()) {
			cleanup();
		}

		// Perform cleanup action on timeout
		clearTimeout(timeoutId);
		timeoutId = setTimeout(cleanup, localCacheTimeout());

		return returnData;
	};

	const execute = async <T>(
		query: { execute: () => Promise<T>; toSQL: () => Query },
		title?: string
	) => {
		if (disable()) {
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

		if (queryInformation.length > localCacheSize()) {
			cleanup();
		}

		// Perform cleanup action on timeout
		clearTimeout(timeoutId);
		timeoutId = setTimeout(cleanup, localCacheTimeout());

		return returnData;
	};

	return {
		triggerClean: cleanup,
		getQueries: () => queryInformation,
		execute,
		executeRaw
	};
};

let dbLoggerInstance: ReturnType<typeof dbLoggerCreate> | undefined;

export const initDBLogger = async (context: GlobalContext) => {
	dbLoggerInstance = dbLoggerCreate({
		localCacheSize: () => context.serverEnv.DBLOG_CACHE_SIZE,
		localCacheTimeout: () => context.serverEnv.DBLOG_CACHE_TIMEOUT,
		disable: () => !context.serverEnv.DBLOG_ENABLE,
		storeQueries: async (queries) => {
			if (queries.length === 0) return;

			await context.db.insert(queryLogTable).values(
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

			await queryLogActions.tidy();
		},
		logError: (...args) =>
			context.logger('database').error({ code: 'DB_0001', title: args[0], error: args })
	});
};

export const dbExecuteLogger: ExecuteFunction = async <T>(
	query: { execute: () => Promise<T>; toSQL: () => Query },
	title?: string
): Promise<T> => {
	if (dbLoggerInstance) {
		return dbLoggerInstance.execute(query, title);
	} else {
		throw new Error('No DB Logger Instance');
	}
};

export const dbExecuteRawLogger: ExecuteRawFunction = <T>(
	query: PgRaw<T>,
	title?: string
): Promise<T> => {
	if (dbLoggerInstance) {
		return dbLoggerInstance.executeRaw(query, title);
	} else {
		throw new Error('No DB Logger Instance');
	}
};
