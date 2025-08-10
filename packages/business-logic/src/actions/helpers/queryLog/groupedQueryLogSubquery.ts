import type { DBType } from '@totallator/database';
import { queryLogTable } from '@totallator/database';
import { and, count as drizzleCount, max, min, avg, sum, type SQL, sql } from 'drizzle-orm';

const timeBucketStart = 0;
const timeBucketEnd = 100;
const timeBucketStep = 5;

const timeBuckets = Array.from(
	{ length: (timeBucketEnd - timeBucketStart) / timeBucketStep },
	(_, i) => i * timeBucketStep
);

export const groupedQueryLogSubquery = ({ db, where }: { db: DBType; where: SQL<unknown>[] }) => {
	return db
		.select({
			titleId: queryLogTable.titleId,
			maxDuration: max(queryLogTable.duration).as('maxDuration'),
			minDuration: min(queryLogTable.duration).as('minDuration'),
			averageDuration: avg(queryLogTable.duration).as('averageDuration'),
			maxSize: max(queryLogTable.size).as('maxSize'),
			minSize: min(queryLogTable.size).as('minSize'),
			averageSize: avg(queryLogTable.size).as('averageSize'),
			count: drizzleCount(queryLogTable.id).as('count'),
			first: min(queryLogTable.time).as('first'),
			last: max(queryLogTable.time).as('last'),
			totalTime: sum(queryLogTable.duration).as('totalTime'),
			totalSize: sum(queryLogTable.size).as('totalSize'),
			timeBuckets: sql
				.raw(
					` jsonb_build_object( ${timeBuckets
						.map(
							(time) =>
								`'${time.toString().padStart(4, '0')}to${(time + timeBucketStep).toString().padStart(4, '0')}', COUNT(*) FILTER (WHERE ${queryLogTable.duration.name} >= ${time} AND ${queryLogTable.duration.name} < ${time + timeBucketStep})`
						)
						.join(',')})`
				)
				.as<Record<string, number>>('timeBuckets')
		})
		.from(queryLogTable)
		.where(and(...where))
		.groupBy(queryLogTable.titleId)
		.as('queryLogSubquery');
};

export type GroupedQueryLogSubqueryType = ReturnType<typeof groupedQueryLogSubquery>;
