import { type Query } from 'drizzle-orm';
import { nanoid } from 'nanoid';

type QueryRecordInfo = {
	id: string;
	count: number;
	latest: Date;
	shortestTime: number;
	longestTime: number;
	totalTime: number;
	averageTime: number;
	queries: {
		time: Date;
		duration: number;
		params: any;
	}[];
};

const queryInformation: Record<string, QueryRecordInfo> = {};

export const dbLogger = async <T>(query: {
	execute: () => Promise<T>;
	getSQL: () => SQL<unknown>;
	toSQL: () => Query;
}) => {
	const start = Date.now();
	const returnData = await query.execute();
	const end = Date.now();
	const time = end - start;
	const queryInfo = query.getSQL();

	if (queryInformation[queryInfo.sql]) {
		queryInformation[queryInfo.sql].count++;
		queryInformation[queryInfo.sql].latest = new Date();
		queryInformation[queryInfo.sql].totalTime += time;
		queryInformation[queryInfo.sql].averageTime =
			queryInformation[queryInfo.sql].totalTime / queryInformation[queryInfo.sql].count;
		queryInformation[queryInfo.sql].shortestTime = Math.min(
			queryInformation[queryInfo.sql].shortestTime,
			time
		);
		queryInformation[queryInfo.sql].longestTime = Math.max(
			queryInformation[queryInfo.sql].longestTime,
			time
		);
		queryInformation[queryInfo.sql].queries.push({
			time: new Date(),
			duration: time,
			params: queryInfo.params
		});
	} else {
		queryInformation[queryInfo.sql] = {
			id: nanoid(),
			count: 1,
			latest: new Date(),
			shortestTime: time,
			longestTime: time,
			totalTime: time,
			averageTime: time,
			queries: [
				{
					time: new Date(),
					duration: time,
					params: queryInfo.params
				}
			]
		};
	}

	console.log(query.toSQL().sql);

	console.log(`Query took ${end - start}ms`);
	return returnData;
};
