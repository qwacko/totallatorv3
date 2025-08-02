import { count as drizzleCount, and, isNull, isNotNull, lt, asc, inArray, eq } from 'drizzle-orm';
import type {
	GroupedQueryLogFilterType,
	QueryLogFilterSchemaType,
	QueryLogFilterSchemaWithoutPaginationType
} from '@totallator/shared';
import {
	queryLogFilterToQuery,
	queryLogFilterToText
} from './helpers/queryLog/queryLogFilterToQuery';
import { groupedQueryLogSubquery } from './helpers/queryLog/groupedQueryLogSubquery';
import { groupedQueryLogOrderByToSQL } from './helpers/queryLog/groupedQueryLogOrderByToSQL';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import {
	queryLogTable,
	queryContentsTable,
	queryLogTitleTable
} from '@totallator/database';
import { queryLogOrderByToSQL } from './helpers/queryLog/queryLogOrderByToSQL';
import { filterNullUndefinedAndDuplicates } from '../helpers/filterNullUndefinedAndDuplicates';
import { nanoid } from 'nanoid';
import { getServerEnv } from '@/serverEnv';
import type { PaginatedResults } from './helpers/journal/PaginationType';
import { getContextDB } from '@totallator/context';

const paginationReturnBuilder = <T extends Record<string, any>>({
	data,
	countResult,
	pageNo,
	pageSize
}: {
	data: T[];
	countResult: { count: number }[];
	pageNo: number;
	pageSize: number;
}): PaginatedResults<T> => {
	const count = countResult[0].count;
	const pageCount = Math.max(1, Math.ceil(count / pageSize));

	return { count, data, pageCount, page: pageNo, pageSize };
};

export const queryLogActions = {
	filterToText: async ({
		filter
	}: {
		filter: QueryLogFilterSchemaWithoutPaginationType;
	}): Promise<string[]> => {
		const db = getContextDB();
		const filterText = await queryLogFilterToText({ db, filter });

		return filterText;
	},
	listGroups: async ({
		filter
	}: {
		filter: GroupedQueryLogFilterType;
	}): Promise<
		PaginatedResults<{
			titleId: string | null;
			title: string | null;
			count: number;
			first: Date | null;
			last: Date | null;
			maxDuration: number | null;
			minDuration: number | null;
			averageDuration: string | null;
			maxSize: number | null;
			minSize: number | null;
			averageSize: string | null;
			totalTime: string | null;
			totalSize: string | null;
			timeBuckets: Record<string, number>;
		}>
	> => {
		const db = getContextDB();
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = queryLogFilterToQuery({ filter: restFilter });

		const subquery = groupedQueryLogSubquery({ db, where });

		const orderBySQL = groupedQueryLogOrderByToSQL({ orderBy, subquery });

		const results = await dbExecuteLogger(
			db
				.select({
					titleId: subquery.titleId,
					title: queryLogTitleTable.title,
					count: subquery.count,
					first: subquery.first,
					last: subquery.last,
					maxDuration: subquery.maxDuration,
					minDuration: subquery.minDuration,
					averageDuration: subquery.averageDuration,
					maxSize: subquery.maxSize,
					minSize: subquery.minSize,
					averageSize: subquery.averageSize,
					totalTime: subquery.totalTime,
					totalSize: subquery.totalSize,
					timeBuckets: subquery.timeBuckets
				})
				.from(subquery)
				.leftJoin(queryLogTitleTable, eq(subquery.titleId, queryLogTitleTable.id))
				.orderBy(...orderBySQL)
				.limit(pageSize)
				.offset(page * pageSize),
			'Query Log - List Groups - Query'
		);

		const resultCount = await dbExecuteLogger(
			db.select({ count: drizzleCount(subquery.count) }).from(subquery),
			'Query Log - List Groups - Count'
		);

		return paginationReturnBuilder({
			data: results,
			countResult: resultCount,
			pageNo: page,
			pageSize
		});
	},
	list: async ({
		filter
	}: {
		filter: QueryLogFilterSchemaType;
	}): Promise<
		PaginatedResults<{
			id: string;
			title: string | null;
			titleId: string | null;
			query: string | null;
			queryId: string | null;
			duration: number;
			time: Date;
			params: string | null;
			size: number;
		}>
	> => {
		const db = getContextDB();
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = queryLogFilterToQuery({ filter: restFilter });

		const orderBySQL = queryLogOrderByToSQL({ orderBy });

		const results = await dbExecuteLogger(
			db
				.select({
					id: queryLogTable.id,
					title: queryLogTitleTable.title,
					titleId: queryLogTable.titleId,
					query: queryContentsTable.query,
					queryId: queryLogTable.queryId,
					duration: queryLogTable.duration,
					time: queryLogTable.time,
					params: queryLogTable.params,
					size: queryLogTable.size
				})
				.from(queryLogTable)
				.leftJoin(queryContentsTable, eq(queryLogTable.queryId, queryContentsTable.id))
				.leftJoin(queryLogTitleTable, eq(queryLogTable.titleId, queryLogTitleTable.id))
				.where(and(...where))
				.orderBy(...orderBySQL)
				.limit(pageSize)
				.offset(page * pageSize),
			'Query Log - List Items - Query'
		);

		const resultCount = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(queryLogTable.query) })
				.from(queryLogTable)
				.leftJoin(queryContentsTable, eq(queryLogTable.queryId, queryContentsTable.id))
				.leftJoin(queryLogTitleTable, eq(queryLogTable.titleId, queryLogTitleTable.id))
				.where(and(...where)),
			'Query Log - ListItems - Count'
		);

		return paginationReturnBuilder({
			data: results,
			countResult: resultCount,
			pageNo: page,
			pageSize
		});
	},
	listXY: async ({
		filter
	}: {
		filter: QueryLogFilterSchemaType;
	}): Promise<{ id: string; duration: number; time: Date; title: string | null }[]> => {
		const db = getContextDB();
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = queryLogFilterToQuery({ filter: restFilter });

		const results = await dbExecuteLogger(
			db
				.select({
					id: queryLogTable.id,
					duration: queryLogTable.duration,
					time: queryLogTable.time,
					title: queryLogTitleTable.title
				})
				.from(queryLogTable)
				.leftJoin(queryContentsTable, eq(queryLogTable.queryId, queryContentsTable.id))
				.leftJoin(queryLogTitleTable, eq(queryLogTable.titleId, queryLogTitleTable.id))
				.where(and(...where)),
			'Query Log - List XY - Query'
		);

		return results;
	},
	tidy: async (): Promise<void> => {
		const db = getContextDB();
		const dbLogStorageHours = getServerEnv().DBLOG_STORAGE_HOURS;
		const dbLogStorageCount = getServerEnv().DBLOG_STORAGE_COUNT;

		//Remove logs older than 30 days
		await db
			.delete(queryLogTable)
			.where(lt(queryLogTable.time, new Date(Date.now() - dbLogStorageHours * 60 * 60 * 1000)));

		//Remove the oldest logs if there are more than 100000
		const queryLogCount = await db
			.select({ count: drizzleCount(queryLogTable.id) })
			.from(queryLogTable)
			.execute();
		if (queryLogCount[0].count > dbLogStorageCount) {
			const oldestLogs = await db
				.select({ id: queryLogTable.id })
				.from(queryLogTable)
				.orderBy(asc(queryLogTable.time))
				.limit(queryLogCount[0].count - dbLogStorageCount)
				.execute();
			await db.delete(queryLogTable).where(
				inArray(
					queryLogTable.id,
					oldestLogs.map((log) => log.id)
				)
			);
		}

		///Add Query With Blank
		const blankQueryItem = await db.query.queryContentsTable.findFirst({
			where: ({ query }, { eq }) => eq(query, 'Blank')
		});

		if (!blankQueryItem) {
			await db.insert(queryContentsTable).values({ id: nanoid(), query: 'Blank' }).execute();
		}

		const logsWithoutQuery = await db
			.select()
			.from(queryLogTable)
			.where(isNull(queryLogTable.queryId))
			.execute();

		if (logsWithoutQuery.length > 0) {
			const missingQueries = filterNullUndefinedAndDuplicates(
				logsWithoutQuery.map((log) => log.query)
			);

			if (missingQueries.length > 0) {
				await db.insert(queryContentsTable).values(
					missingQueries.map((query) => ({
						id: nanoid(),
						query
					}))
				);

				await Promise.all(
					logsWithoutQuery.map(async (log) => {
						const queryContents = await db
							.select()
							.from(queryContentsTable)
							.where(eq(queryContentsTable.query, log.query || 'Blank'))
							.execute();
						const queryContentsId = queryContents[0].id;

						await db
							.update(queryLogTable)
							.set({
								queryId: queryContentsId
							})
							.where(eq(queryLogTable.id, log.id))
							.execute();
					})
				);
			}
		}

		///Add Title With Blank
		const blankTitleItem = await db.query.queryLogTitleTable.findFirst({
			where: ({ title }, { eq }) => eq(title, 'Blank')
		});

		if (!blankTitleItem) {
			await db.insert(queryLogTitleTable).values({ id: nanoid(), title: 'Blank' }).execute();
		}

		const logsWithoutTitle = await db
			.select()
			.from(queryLogTable)
			.where(isNull(queryLogTable.titleId))
			.execute();

		if (logsWithoutTitle.length > 0) {
			const missingTitles = filterNullUndefinedAndDuplicates(
				logsWithoutTitle.map((log) => log.title)
			);

			if (missingTitles.length > 0) {
				await db.insert(queryLogTitleTable).values(
					missingTitles.map((title) => ({
						id: nanoid(),
						title
					}))
				);

				await Promise.all(
					logsWithoutTitle.map(async (log) => {
						const queryLogTitle = await db
							.select()
							.from(queryLogTitleTable)
							.where(eq(queryLogTitleTable.title, log.title || 'Blank'))
							.execute();
						const queryLogTitleId = queryLogTitle[0].id;
						await db
							.update(queryLogTable)
							.set({
								titleId: queryLogTitleId
							})
							.where(eq(queryLogTable.id, log.id))
							.execute();
					})
				);
			}
		}

		//Blank query if there is a queryid
		await db
			.update(queryLogTable)
			.set({
				query: null
			})
			.where(and(isNotNull(queryLogTable.query), isNull(queryLogTable.queryId)))
			.execute();

		//Blank Title if there is a title id
		await db
			.update(queryLogTable)
			.set({
				title: null
			})
			.where(and(isNotNull(queryLogTable.title), isNull(queryLogTable.titleId)))
			.execute();
	}
};
