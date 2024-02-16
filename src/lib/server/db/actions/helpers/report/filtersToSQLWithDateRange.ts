import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
import type { DBType } from '$lib/server/db/db';
import { type SQL } from 'drizzle-orm';
import { materializedJournalFilterToQuery } from '../journalMaterializedView/materializedJournalFilterToQuery';

export const filtersToSQLWithDateRange = async ({
	db,
	filters,
	dateRangeFilter
}: {
	db: DBType;
	filters: JournalFilterSchemaWithoutPaginationType[];
	dateRangeFilter: JournalFilterSchemaWithoutPaginationType;
}) => {
	const filtersSQL = [
		...(await Promise.all(
			filters.map(async (filter) => {
				return materializedJournalFilterToQuery(db, filter, {
					excludeStart: true,
					excludeEnd: true,
					excludeSpan: true
				});
			})
		)),
		await materializedJournalFilterToQuery(db, dateRangeFilter)
	];

	return filtersSQL.reduce((acc, filter) => {
		return [...acc, ...filter];
	}, [] as SQL<unknown>[]);
};
