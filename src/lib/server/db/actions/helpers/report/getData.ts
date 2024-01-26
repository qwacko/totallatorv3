import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
import type {
	ReportElementConfigNumberType,
	ReportElementConfigType
} from '$lib/schema/reportSchema';
import type { DBType } from '$lib/server/db/db';
import { journalExtendedView } from '$lib/server/db/postgres/schema/materializedViewSchema';
import { sum, type SQL, and, sql } from 'drizzle-orm';
import { filtersToSQLWithDateRange } from './filtersToSQLWithDateRange';
import { filtersToDateRange } from './filtersToDateRange';

type FilterSQLType = {
	all: Promise<SQL<unknown>[]>;
	withinRange: Promise<SQL<unknown>[]>;
	upToRangeEnd: Promise<SQL<unknown>[]>;
	beforeRange: Promise<SQL<unknown>[]>;
};

export const getData = ({
	db,
	config,
	filters
}: {
	db: DBType;
	config: ReportElementConfigType | null;
	filters: JournalFilterSchemaWithoutPaginationType[];
}) => {
	if (!config) return;

	const dateRange = filtersToDateRange(filters);
	console.log('dateRange', dateRange);

	const filtersSQL = {
		all: filtersToSQLWithDateRange({ db, filters, dateRangeFilter: {} }),
		withinRange: filtersToSQLWithDateRange({
			db,
			filters,
			dateRangeFilter: {
				dateBefore: dateRange.end.toISOString(),
				dateAfter: dateRange.start.toISOString()
			}
		}),
		upToRangeEnd: filtersToSQLWithDateRange({
			db,
			filters,
			dateRangeFilter: { dateBefore: dateRange.end.toISOString() }
		}),
		beforeRange: filtersToSQLWithDateRange({
			db,
			filters,
			dateRangeFilter: { dateBefore: dateRange.start.toISOString() }
		})
	} satisfies FilterSQLType;

	if (config.type === 'number') {
		return getNumberData({ db, config, filtersSQL, dateRange });
	}

	return { ...config };
};

export type ReportElementData = ReturnType<typeof getData>;

const getNumberData = ({
	db,
	config,
	filtersSQL,
	dateRange
}: {
	db: DBType;
	config: ReportElementConfigNumberType;
	filtersSQL: FilterSQLType;
	dateRange: {
		start: Date;
		end: Date;
	};
}) => {
	const dataFunction = async () => {
		const useFilters = await filtersSQL.withinRange;

		const total = await db
			.select({ sum: sum(journalExtendedView.amount).mapWith(Number) })
			.from(journalExtendedView)
			.where(useFilters.length > 0 ? and(...useFilters) : sql`true`)
			.execute();

		return total[0].sum;
	};

	return { ...config, data: dataFunction() };
};

export type ReportElementNumberData = ReturnType<typeof getNumberData>;
