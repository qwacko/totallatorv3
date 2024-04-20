import { nanoid } from 'nanoid';
import { logging } from '../logging';
import { db } from './db';
import { queryLogTable } from './postgres/schema';
import { lt, asc, count, inArray } from 'drizzle-orm';

type QueryCache = {
	title?: string;
	query: string;
	time: Date;
	duration: number;
	params: unknown[];
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

	const execute = async <T>(
		query: { execute: () => Promise<T>; toSQL: () => Query },
		title?: string
	) => {
		if (disable) {
			return query.execute();
		}
		const start = Date.now();
		const returnData = await query.execute();
		const end = Date.now();
		const time = end - start;
		const queryInfo = query.toSQL();

		queryInformation.push({
			title,
			query: queryInfo.sql,
			time: new Date(),
			duration: time,
			params: queryInfo.params
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
		execute
	};
};

const dbLogger = dbLoggerCreate({
	localCacheSize: 1000,
	localCacheTimeout: 5000,
	storeQueries: async (queries) => {
		const startTime = Date.now();

		await db.insert(queryLogTable).values(
			queries.map((query) => ({
				id: nanoid(),
				title: query.title,
				query: query.query,
				time: query.time,
				duration: query.duration,
				params: JSON.stringify(query.params)
			}))
		);
		//Remove logs older than 30 days
		await db
			.delete(queryLogTable)
			.where(lt(queryLogTable.time, new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)));

		//Remove the oldest logs if there are more than 100000
		const queryLogCount = await db
			.select({ count: count(queryLogTable.id) })
			.from(queryLogTable)
			.execute();
		if (queryLogCount[0].count > 100000) {
			const oldestLogs = await db
				.select({ id: queryLogTable.id })
				.from(queryLogTable)
				.orderBy(asc(queryLogTable.time))
				.limit(queryLogCount[0].count - 100000)
				.execute();
			await db.delete(queryLogTable).where(
				inArray(
					queryLogTable.id,
					oldestLogs.map((log) => log.id)
				)
			);
		}

		const endTime = Date.now();
		logging.info(`Stored ${queries.length} queries in ${endTime - startTime}ms`);
	},
	logError: logging.error
});

export const dbExecuteLogger = dbLogger.execute;
