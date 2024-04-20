import type { DBType } from '../../../db';
import { queryLogTable } from '../../../postgres/schema';
import { and, count as drizzleCount, max, min, avg, type SQL } from 'drizzle-orm';

export const groupedQueryLogSubquery = ({ db, where }: { db: DBType; where: SQL<unknown>[] }) => {
	return db
		.select({
			title: queryLogTable.title,
			maxDuration: max(queryLogTable.duration),
			minDuration: min(queryLogTable.duration),
			averageDuration: avg(queryLogTable.duration),
			count: drizzleCount(queryLogTable.id)
		})
		.from(queryLogTable)
		.where(and(...where))
		.groupBy(queryLogTable.title)
		.as('queryLogSubquery');
};

export type GroupedQueryLogSubqueryType = ReturnType<typeof groupedQueryLogSubquery>;
