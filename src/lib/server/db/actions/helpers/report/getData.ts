import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
import type {
	ReportElementConfigNumberType,
	ReportElementConfigType
} from '$lib/schema/reportSchema';
import type { DBType } from '$lib/server/db/db';
import { journalExtendedView } from '$lib/server/db/postgres/schema/materializedViewSchema';
import { sum, type SQL, and, sql, count, eq, lt, min } from 'drizzle-orm';
import { filtersToSQLWithDateRange } from './filtersToSQLWithDateRange';
import { filtersToDateRange } from './filtersToDateRange';
import { displayTimeOptionsData } from '$lib/schema/reportHelpers/displayTimeOptionsEnum';
import type { SpanOptionType } from '$lib/schema/reportHelpers/spanOptions';
import { generateYearMonthsBetween } from '$lib/helpers/generateYearMonthsBetween';
import {
	displaySparklineOptionsData,
	type DisplaySparklineOptionsType
} from '$lib/schema/reportHelpers/displaySparklineOptionsEnum';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';

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
		const primaryInfo = displayTimeOptionsData[config.numberDisplay];
		const secondaryInfo = displayTimeOptionsData[config.numberSecondaryDisplay];

		const primaryFilters =
			primaryInfo.id === 'none'
				? undefined
				: await getFilterFromSpan({ filtersSQL, span: primaryInfo.span });
		const timeSeries = await getSingleTimeSeriesData({
			db,
			filters: primaryFilters || [],
			timeSpan: dateRange,
			type: config.numberSparkline,
			filtersAll: await filtersSQL.all
		});

		const total =
			primaryInfo.id === 'none'
				? 0
				: await getTotal({
						db,
						filters: await getFilterFromSpan({ filtersSQL, span: primaryInfo.span }),
						type: primaryInfo.type
					});

		const secondaryTotal =
			secondaryInfo.id === 'none'
				? 0
				: await getTotal({
						db,
						filters: await getFilterFromSpan({ filtersSQL, span: secondaryInfo.span }),
						type: secondaryInfo.type
					});

		return { primary: total, secondary: secondaryTotal, timeSeries };
	};

	return { ...config, data: dataFunction() };
};

const getFilterFromSpan = async ({
	filtersSQL,
	span
}: {
	filtersSQL: FilterSQLType;
	span: SpanOptionType | undefined;
}) => {
	return span
		? span === 'all'
			? await filtersSQL.all
			: span === 'withinRange'
				? await filtersSQL.withinRange
				: span === 'upToRange'
					? await filtersSQL.upToRangeEnd
					: await filtersSQL.all
		: await filtersSQL.all;
};

const getSingleTimeSeriesData = async ({
	db,
	filters,
	filtersAll,
	timeSpan,
	type = 'none'
}: {
	db: DBType;
	filters: SQL<unknown>[];
	filtersAll: SQL<unknown>[];
	timeSpan: { start: Date; end: Date };
	type?: DisplaySparklineOptionsType;
}) => {
	const typeDetail = displaySparklineOptionsData[type];

	if (!typeDetail) return undefined;
	if (typeDetail.id === 'none') return undefined;

	const grouping = typeDetail.grouping;
	const span = typeDetail.span;
	const useRunningTotal = typeDetail.runningTotal;
	const displayType = typeDetail.type;

	const sumFromStart = span === 'all' || span === 'upToRange';

	const monthSeries = generateYearMonthsBetween(
		timeSpan.start.toISOString().slice(0, 7),
		timeSpan.end.toISOString().slice(0, 7)
	);

	const monthGrouping = grouping === 'month' && monthSeries.length < 40;

	const seriesToUse = monthGrouping
		? monthSeries
		: filterNullUndefinedAndDuplicates(monthSeries.map((m) => m.slice(0, 4)));

	const dateSeries = db
		.$with('date_series')
		.as((qb) =>
			qb
				.select({ dateSeries: sql<string>`date_series.year_month`.as('year_month_series') })
				.from(sql.raw(`(VALUES ('${seriesToUse.join("'), ('")}')) AS date_series(year_month)`))
		);

	const compareColumn = monthGrouping ? journalExtendedView.yearMonth : journalExtendedView.year;

	const data = await db
		.with(dateSeries)
		.select({
			time: compareColumn,
			amount:
				displayType === 'sum'
					? sql<number>`COALESCE(SUM(${journalExtendedView.amount}), 0)`
							.mapWith(Number)
							.as('total_amount')
					: sql<number>`COALESCE(COUNT(${journalExtendedView.id}), 0)`
							.mapWith(Number)
							.as('total_amount'),
			earliestDate: min(journalExtendedView.dateText).as('earliest_date')
		})
		.from(dateSeries)
		.leftJoin(journalExtendedView, eq(dateSeries.dateSeries, compareColumn))
		.where(filters.length > 0 ? and(...filters) : sql`true`)
		.groupBy(compareColumn)
		.orderBy(compareColumn)
		.execute();

	const earliestDate = data.reduce(
		(prev, current) =>
			current.earliestDate
				? new Date(current.earliestDate) < prev
					? new Date(current.earliestDate)
					: prev
				: prev,
		new Date()
	);

	const beforeAmountResult = await db
		.select({ total: sum(journalExtendedView.amount).mapWith(Number) })
		.from(journalExtendedView)
		.where(and(...[...filtersAll, lt(journalExtendedView.dateText, earliestDate.toISOString())]))
		.execute();

	const beforeAmount = beforeAmountResult[0].total;

	const returnData = data.map((d, i) => {
		const runningTotal = data.slice(0, i).reduce((acc, cur) => acc + cur.amount, 0);
		const adder = sumFromStart ? runningTotal + beforeAmount : runningTotal;

		const amount = useRunningTotal ? d.amount + adder : d.amount;

		return {
			x: d.time,
			amount
		};
	});

	return returnData;
};

export type SingleTimeSeriesData = ReturnType<typeof getSingleTimeSeriesData>;

const getTotal = async ({
	db,
	filters,
	type
}: {
	db: DBType;
	filters: SQL<unknown>[];
	type: 'sum' | 'count';
}) => {
	if (type === 'sum') {
		const data = await db
			.select({ sum: sum(journalExtendedView.amount).mapWith(Number) })
			.from(journalExtendedView)
			.where(filters.length > 0 ? and(...filters) : sql`true`)
			.execute();

		return data[0].sum;
	}
	const data = await db
		.select({ count: count(journalExtendedView.id) })
		.from(journalExtendedView)
		.where(filters.length > 0 ? and(...filters) : sql`true`)
		.execute();

	return data[0].count;
};

export type ReportElementNumberData = ReturnType<typeof getNumberData>;
