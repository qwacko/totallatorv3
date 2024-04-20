import type { DBType } from '../db';
import { count as drizzleCount } from 'drizzle-orm';
import type { GroupedQueryLogFilterType } from '$lib/schema/queryLogSchema';
import { queryLogFilterToQuery } from './helpers/queryLog/queryLogFilterToQuery';
import { groupedQueryLogSubquery } from './helpers/queryLog/groupedQueryLogSubquery';
import { groupedQueryLogOrderByToSQL } from './helpers/queryLog/groupedQueryLogOrderByToSQL';
import { dbExecuteLogger } from '../dbLogger';

export const queryLogActions = {
	listGroups: async ({ db, filter }: { db: DBType; filter: GroupedQueryLogFilterType }) => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = queryLogFilterToQuery({ filter: restFilter });

		const subquery = groupedQueryLogSubquery({ db, where });

		const orderBySQL = groupedQueryLogOrderByToSQL({ orderBy, subquery });

		const results = await dbExecuteLogger(
			db
				.select()
				.from(subquery)
				.orderBy(...orderBySQL)
				.limit(pageSize)
				.offset(page * pageSize),
			'Query Log - List Groups - Query'
		);

		const resultCount = await dbExecuteLogger(
			db.select({ count: drizzleCount(subquery.title) }).from(subquery),
			'Query Log - List Groups - Count'
		);

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };

		return results;
	}
};
