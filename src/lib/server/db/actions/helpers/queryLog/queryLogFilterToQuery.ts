import { queryLogTable, queryLogTitleTable, queryContentsTable } from '../../../postgres/schema';
import { SQL, not, lte, gte, inArray } from 'drizzle-orm';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';
import type { DBType } from '$lib/server/db/db';
import { ilikeArrayWrapped, inArrayWrapped } from '../misc/inArrayWrapped';
import { arrayToText } from '../misc/arrayToText';
import type { QueryLogFilterSchemaWithoutPaginationType } from '$lib/schema/queryLogSchema';
import { processQueryLogTextFilter } from './queryLogTextFilter';
import { dbExecuteLogger } from '$lib/server/db/dbLogger';

export const queryLogFilterToQuery = ({
	filter
}: {
	filter: QueryLogFilterSchemaWithoutPaginationType;
}) => {
	const restFilter = processQueryLogTextFilter.process(filter);

	const targetTable = queryLogTable;

	const where: SQL<unknown>[] = [];

	if (restFilter.idArray && restFilter.idArray.length > 0) {
		where.push(inArrayWrapped(targetTable.id, restFilter.idArray));
	}
	if (restFilter.excludeIdArray && restFilter.excludeIdArray.length > 0) {
		where.push(not(inArrayWrapped(targetTable.id, restFilter.excludeIdArray)));
	}
	if (restFilter.titleArray && restFilter.titleArray.length > 0) {
		where.push(ilikeArrayWrapped(targetTable.title, restFilter.titleArray));
	}
	if (restFilter.excludeTitleArray && restFilter.excludeTitleArray.length > 0) {
		where.push(not(ilikeArrayWrapped(targetTable.title, restFilter.excludeTitleArray)));
	}
	if (restFilter.start) {
		where.push(gte(targetTable.time, new Date(restFilter.start)));
	}
	if (restFilter.end) {
		where.push(lte(targetTable.time, new Date(restFilter.end)));
	}
	if (restFilter.minSize !== undefined) {
		where.push(gte(targetTable.size, restFilter.minSize * 1000));
	}
	if (restFilter.maxSize !== undefined) {
		where.push(lte(targetTable.size, restFilter.maxSize * 1000));
	}
	if (restFilter.maxDuration !== undefined) {
		where.push(lte(targetTable.duration, restFilter.maxDuration));
	}
	if (restFilter.minDuration !== undefined) {
		where.push(gte(targetTable.duration, restFilter.minDuration));
	}
	if (restFilter.queryArray && restFilter.queryArray.length > 0) {
		where.push(inArrayWrapped(targetTable.query, restFilter.queryArray));
	}
	if (restFilter.excludeQueryArray && restFilter.excludeQueryArray.length > 0) {
		where.push(not(inArrayWrapped(targetTable.query, restFilter.excludeQueryArray)));
	}
	if (restFilter.titleIdArray) {
		where.push(inArrayWrapped(targetTable.titleId, restFilter.titleIdArray));
	}
	if (restFilter.excludeTitleIdArray) {
		where.push(not(inArrayWrapped(targetTable.titleId, restFilter.excludeTitleIdArray)));
	}
	if (restFilter.queryIdArray) {
		where.push(inArrayWrapped(targetTable.queryId, restFilter.queryIdArray));
	}
	if (restFilter.excludeQueryIdArray) {
		where.push(not(inArrayWrapped(targetTable.queryId, restFilter.excludeQueryIdArray)));
	}
	if (restFilter.lastMinutes) {
		const startTime = new Date();
		startTime.setMinutes(startTime.getMinutes() - restFilter.lastMinutes);
		where.push(gte(targetTable.time, startTime));
	}

	return where;
};

const queryTitleIdToTitle = async ({ db, titleIds }: { db: DBType; titleIds: string[] }) => {
	const title = await dbExecuteLogger(
		db.select().from(queryLogTitleTable).where(inArray(queryLogTitleTable.id, titleIds)),
		'Query Log - Title ID to Title'
	);
	return title.map((t) => t.title || t.id);
};

const queryQueryIdToQuery = async ({ db, queryIds }: { db: DBType; queryIds: string[] }) => {
	const query = await dbExecuteLogger(
		db.select().from(queryContentsTable).where(inArray(queryContentsTable.id, queryIds)),
		'Query Log - Query ID to Query'
	);
	return query.map((q) => q.query || q.id);
};

export const queryLogFilterToText = async ({
	db,
	filter,
	prefix,
	allText = true
}: {
	db: DBType;
	filter: QueryLogFilterSchemaWithoutPaginationType;
	prefix?: string;
	allText?: boolean;
}) => {
	const restFilter = processQueryLogTextFilter.process(filter);

	const stringArray: string[] = [];

	if (restFilter.idArray && restFilter.idArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.idArray,
				singularName: 'ID',
				midText: 'is '
			})
		);
	}
	if (restFilter.excludeIdArray && restFilter.excludeIdArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeIdArray,
				singularName: 'ID',
				midText: 'is not '
			})
		);
	}

	if (restFilter.titleArray && restFilter.titleArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.titleArray,
				singularName: 'Title',
				midText: 'contains'
			})
		);
	}
	if (restFilter.excludeTitleArray && restFilter.excludeTitleArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeTitleArray,
				singularName: 'Title',
				midText: 'does not contain'
			})
		);
	}
	if (restFilter.start) {
		stringArray.push(`Starting from ${restFilter.start}`);
	}
	if (restFilter.end) {
		stringArray.push(`Ending at ${restFilter.end}`);
	}
	if (restFilter.maxDuration !== undefined) {
		stringArray.push(`Max duration is ${restFilter.maxDuration}`);
	}
	if (restFilter.minDuration !== undefined) {
		stringArray.push(`Min duration is ${restFilter.minDuration}`);
	}
	if (restFilter.minSize !== undefined) {
		stringArray.push(`Min size is ${restFilter.minSize}`);
	}
	if (restFilter.maxSize !== undefined) {
		stringArray.push(`Max size is ${restFilter.maxSize}`);
	}
	if (restFilter.queryArray && restFilter.queryArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.queryArray,
				singularName: 'Query',
				midText: 'contains'
			})
		);
	}
	if (restFilter.excludeQueryArray && restFilter.excludeQueryArray.length > 0) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeQueryArray,
				singularName: 'Query',
				midText: 'does not contain'
			})
		);
	}
	if (restFilter.titleIdArray) {
		stringArray.push(
			await arrayToText({
				data: restFilter.titleIdArray,
				singularName: 'Title ID',
				midText: 'contains',
				inputToText: async (titleIds) => queryTitleIdToTitle({ db, titleIds })
			})
		);
	}
	if (restFilter.excludeTitleIdArray) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeTitleIdArray,
				singularName: 'Title ID',
				midText: 'does not contain',
				inputToText: async (titleIds) => queryTitleIdToTitle({ db, titleIds })
			})
		);
	}
	if (restFilter.queryIdArray) {
		stringArray.push(
			await arrayToText({
				data: restFilter.queryIdArray,
				singularName: 'Query ID',
				midText: 'contains',
				inputToText: async (queryIds) => queryQueryIdToQuery({ db, queryIds })
			})
		);
	}
	if (restFilter.excludeQueryIdArray) {
		stringArray.push(
			await arrayToText({
				data: restFilter.excludeQueryIdArray,
				singularName: 'Query ID',
				midText: 'does not contain',
				inputToText: async (queryIds) => queryQueryIdToQuery({ db, queryIds })
			})
		);
	}
	if (restFilter.lastMinutes) {
		stringArray.push(`Last ${restFilter.lastMinutes} minutes`);
	}

	return filterToQueryFinal({ stringArray, allText, prefix });
};
