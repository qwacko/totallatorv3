import { queryLogTable } from '../../../postgres/schema';
import { SQL, not, lte, gte } from 'drizzle-orm';
import { filterToQueryFinal } from '../misc/filterToQueryFinal';
import type { DBType } from '$lib/server/db/db';
import { ilikeArrayWrapped, inArrayWrapped } from '../misc/inArrayWrapped';
import { arrayToText } from '../misc/arrayToText';
import type { QueryLogFilterSchemaWithoutPaginationType } from '$lib/schema/queryLogSchema';
import { processQueryLogTextFilter } from './queryLogTextFilter';

export const queryLogFilterToQuery = ({
	filter
}: {
	filter: QueryLogFilterSchemaWithoutPaginationType;
}) => {
	const restFilter = processQueryLogTextFilter.process(filter);

	const targetTable = queryLogTable;

	const where: SQL<unknown>[] = [];

	if (restFilter.titleArray && restFilter.titleArray.length > 0) {
		where.push(ilikeArrayWrapped(targetTable.title, restFilter.titleArray));
	}
	if (restFilter.excludeTitleArray && restFilter.excludeTitleArray.length > 0) {
		where.push(not(ilikeArrayWrapped(targetTable.title, restFilter.excludeTitleArray)));
	}
	if (restFilter.start) {
		where.push(gte(targetTable.time, restFilter.start));
	}
	if (restFilter.end) {
		where.push(lte(targetTable.time, restFilter.end));
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
	if (restFilter.lastMinutes) {
		const startTime = new Date();
		startTime.setMinutes(startTime.getMinutes() - restFilter.lastMinutes);
		where.push(gte(targetTable.time, startTime));
	}

	return where;
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
	if (restFilter.lastMinutes) {
		stringArray.push(`Last ${restFilter.lastMinutes} minutes`);
	}

	return filterToQueryFinal({ stringArray, allText, prefix });
};
