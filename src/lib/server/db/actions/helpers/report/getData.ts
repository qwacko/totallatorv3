import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
import type { DBType } from '$lib/server/db/db';
// import { journalExtendedView } from '$lib/server/db/postgres/schema/materializedViewSchema';
import { type SQL } from 'drizzle-orm';
import { filtersToSQLWithDateRange } from './filtersToSQLWithDateRange';
import { filtersToDateRange } from './filtersToDateRange';
// import { displayTimeOptionsData } from '$lib/schema/reportHelpers/displayTimeOptionsEnum';
// import type { SpanOptionType } from '$lib/schema/reportHelpers/spanOptions';
// import { generateYearMonthsBetween } from '$lib/helpers/generateYearMonthsBetween';
// import {
// 	displaySparklineOptionsData,
// 	type DisplaySparklineOptionsType
// } from '$lib/schema/reportHelpers/displaySparklineOptionsEnum';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
import type {
	ReportConfigPartIndividualSchemaType,
	ReportConfigPartSchemaNonTimeGraphType,
	ReportConfigPartSchemaNumberCurrencyType,
	ReportConfigPartSchemaSparklineType,
	ReportConfigPartSchemaStringType,
	ReportConfigPartSchemaTimeGraphType
} from '$lib/schema/reportHelpers/reportConfigPartSchema';

type FilterSQLType = {
	all: Promise<SQL<unknown>[]>;
	withinRange: Promise<SQL<unknown>[]>;
	upToRangeEnd: Promise<SQL<unknown>[]>;
	beforeRange: Promise<SQL<unknown>[]>;
};

type DateRangeType = ReturnType<typeof filtersToDateRange>;

type FilterInformationType = {
	filtersSQL: FilterSQLType;
	dateRange: DateRangeType;
};

export const getItemData = ({
	db,
	config,
	filters,
	commonFilters
}: {
	db: DBType;
	config: ReportConfigPartIndividualSchemaType | null;
	commonFilters: JournalFilterSchemaWithoutPaginationType[];
	filters: JournalFilterSchemaWithoutPaginationType[];
}) => {
	if (!config) return;

	const filterConfiguration = filters.map((currentFilter) => {
		const combinedFilters = filterNullUndefinedAndDuplicates([currentFilter, ...commonFilters]);
		const dateRange = filtersToDateRange(combinedFilters);

		const filtersSQL = {
			all: filtersToSQLWithDateRange({ db, filters: combinedFilters, dateRangeFilter: {} }),
			withinRange: filtersToSQLWithDateRange({
				db,
				filters: combinedFilters,
				dateRangeFilter: {
					dateBefore: dateRange.end.toISOString(),
					dateAfter: dateRange.start.toISOString()
				}
			}),
			upToRangeEnd: filtersToSQLWithDateRange({
				db,
				filters: combinedFilters,
				dateRangeFilter: { dateBefore: dateRange.end.toISOString() }
			}),
			beforeRange: filtersToSQLWithDateRange({
				db,
				filters: combinedFilters,
				dateRangeFilter: { dateBefore: dateRange.start.toISOString() }
			})
		} satisfies FilterSQLType;

		return { filtersSQL, dateRange };
	});

	if (config.type === 'none') {
		return config;
	}

	if (config.type === 'number' || config.type === 'currency') {
		return getDataDetail.numberCurrency({ db, filterConfig: filterConfiguration[0], config });
	}

	if (config.type === 'string') {
		return getDataDetail.string({ db, filterConfig: filterConfiguration[0], config });
	}

	if (config.type === 'sparkline') {
		return getDataDetail.sparkline({ db, filterConfig: filterConfiguration[0], config });
	}

	if (config.type === 'time_line' || config.type === 'time_stackedArea') {
		return getDataDetail.timeGraph({ db, filterConfig: filterConfiguration[0], config });
	}

	if (config.type === 'pie' || config.type === 'box' || config.type === 'bar') {
		return getDataDetail.nonTimeGraph({ db, filterConfig: filterConfiguration[0], config });
	}

	throw Error("Couldn't find Report Element Type");
};

export type ReportElementItemData = ReturnType<typeof getItemData>;

const getDataDetail = {
	numberCurrency: ({
		db,
		filterConfig,
		config
	}: {
		db: DBType;
		filterConfig: FilterInformationType;
		config: ReportConfigPartSchemaNumberCurrencyType;
	}) => {
		const data = async () => {
			return 26.54;
		};

		return { ...config, data: data() };
	},
	string: ({
		db,
		filterConfig,
		config
	}: {
		db: DBType;
		filterConfig: FilterInformationType;
		config: ReportConfigPartSchemaStringType;
	}) => {
		const data = async () => {
			return 'String Text';
		};

		return { ...config, data: data() };
	},
	sparkline: ({
		db,
		filterConfig,
		config
	}: {
		db: DBType;
		filterConfig: FilterInformationType;
		config: ReportConfigPartSchemaSparklineType;
	}) => {
		const data = async () => {
			return {
				title: 'Data',
				data: [
					{ date: '2021-02', value: 20, text: '$20.00' },
					{ date: '2021-03', value: 30, text: '$30.00' }
				]
			};
		};

		return { ...config, data: data() };
	},
	timeGraph: ({
		db,
		filterConfig,
		config
	}: {
		db: DBType;
		filterConfig: FilterInformationType;
		config: ReportConfigPartSchemaTimeGraphType;
	}) => {
		const data = async () => {};

		return { ...config, data: data() };
	},
	nonTimeGraph: ({
		db,
		filterConfig,
		config
	}: {
		db: DBType;
		filterConfig: FilterInformationType;
		config: ReportConfigPartSchemaNonTimeGraphType;
	}) => {
		const data = async () => {};

		return { ...config, data: data() };
	}
};

export type ReportConfigPartWithData_NumberCurrency = ReturnType<
	typeof getDataDetail.numberCurrency
>;

export type ReportConfigPartWithData_String = ReturnType<typeof getDataDetail.string>;

export type ReportConfigPartWithData_Sparkline = ReturnType<typeof getDataDetail.sparkline>;

export type ReportConfigPartWithData_TimeGraph = ReturnType<typeof getDataDetail.timeGraph>;

export type ReportConfigPartWithData_NonTimeGraph = ReturnType<typeof getDataDetail.nonTimeGraph>;

// const getNumberData = ({
// 	db,
// 	config,
// 	filtersSQL,
// 	dateRange
// }: {
// 	db: DBType;
// 	config: ReportElementConfigNumberType;
// 	filtersSQL: FilterSQLType;
// 	dateRange: {
// 		start: Date;
// 		end: Date;
// 	};
// }) => {
// 	const dataFunction = async () => {
// 		const primaryInfo = displayTimeOptionsData[config.numberDisplay];
// 		const secondaryInfo = displayTimeOptionsData[config.numberSecondaryDisplay];

// 		const primaryFilters =
// 			primaryInfo.id === 'none'
// 				? undefined
// 				: await getFilterFromSpan({ filtersSQL, span: primaryInfo.span });
// 		const timeSeries = await getSingleTimeSeriesData({
// 			db,
// 			filters: primaryFilters || [],
// 			timeSpan: dateRange,
// 			type: config.numberSparkline,
// 			filtersAll: await filtersSQL.all
// 		});

// 		const total =
// 			primaryInfo.id === 'none'
// 				? 0
// 				: await getTotal({
// 						db,
// 						filters: await getFilterFromSpan({ filtersSQL, span: primaryInfo.span }),
// 						type: primaryInfo.type
// 					});

// 		const secondaryTotal =
// 			secondaryInfo.id === 'none'
// 				? 0
// 				: await getTotal({
// 						db,
// 						filters: await getFilterFromSpan({ filtersSQL, span: secondaryInfo.span }),
// 						type: secondaryInfo.type
// 					});

// 		return { primary: total, secondary: secondaryTotal, timeSeries };
// 	};

// 	return { ...config, data: dataFunction() };
// };

// const getFilterFromSpan = async ({
// 	filtersSQL,
// 	span
// }: {
// 	filtersSQL: FilterSQLType;
// 	span: SpanOptionType | undefined;
// }) => {
// 	return span
// 		? span === 'all'
// 			? await filtersSQL.all
// 			: span === 'withinRange'
// 				? await filtersSQL.withinRange
// 				: span === 'upToRange'
// 					? await filtersSQL.upToRangeEnd
// 					: await filtersSQL.all
// 		: await filtersSQL.all;
// };

// const getSingleTimeSeriesData = async ({
// 	db,
// 	filters,
// 	filtersAll,
// 	timeSpan,
// 	type = 'none'
// }: {
// 	db: DBType;
// 	filters: SQL<unknown>[];
// 	filtersAll: SQL<unknown>[];
// 	timeSpan: { start: Date; end: Date };
// 	type?: DisplaySparklineOptionsType;
// }) => {
// 	const typeDetail = displaySparklineOptionsData[type];

// 	if (!typeDetail) return undefined;
// 	if (typeDetail.id === 'none') return undefined;

// 	const grouping = typeDetail.grouping;
// 	const span = typeDetail.span;
// 	const useRunningTotal = typeDetail.runningTotal;
// 	const displayType = typeDetail.type;

// 	const sumFromStart = span === 'all' || span === 'upToRange';

// 	const monthSeries = generateYearMonthsBetween(
// 		timeSpan.start.toISOString().slice(0, 7),
// 		timeSpan.end.toISOString().slice(0, 7)
// 	);

// 	const monthGrouping = grouping === 'month' && monthSeries.length < 40;

// 	const seriesToUse = monthGrouping
// 		? monthSeries
// 		: filterNullUndefinedAndDuplicates(monthSeries.map((m) => m.slice(0, 4)));

// 	const dateSeries = db
// 		.$with('date_series')
// 		.as((qb) =>
// 			qb
// 				.select({ dateSeries: sql<string>`date_series.year_month`.as('year_month_series') })
// 				.from(sql.raw(`(VALUES ('${seriesToUse.join("'), ('")}')) AS date_series(year_month)`))
// 		);

// 	const compareColumn = monthGrouping ? journalExtendedView.yearMonth : journalExtendedView.year;

// 	const data = await db
// 		.with(dateSeries)
// 		.select({
// 			time: compareColumn,
// 			amount:
// 				displayType === 'sum'
// 					? sql<number>`COALESCE(SUM(${journalExtendedView.amount}), 0)`
// 							.mapWith(Number)
// 							.as('total_amount')
// 					: sql<number>`COALESCE(COUNT(${journalExtendedView.id}), 0)`
// 							.mapWith(Number)
// 							.as('total_amount'),
// 			earliestDate: min(journalExtendedView.dateText).as('earliest_date')
// 		})
// 		.from(dateSeries)
// 		.leftJoin(journalExtendedView, eq(dateSeries.dateSeries, compareColumn))
// 		.where(filters.length > 0 ? and(...filters) : sql`true`)
// 		.groupBy(compareColumn)
// 		.orderBy(compareColumn)
// 		.execute();

// 	const earliestDate = data.reduce(
// 		(prev, current) =>
// 			current.earliestDate
// 				? new Date(current.earliestDate) < prev
// 					? new Date(current.earliestDate)
// 					: prev
// 				: prev,
// 		new Date()
// 	);

// 	const beforeAmountResult = await db
// 		.select({
// 			total:
// 				displayType === 'sum'
// 					? sum(journalExtendedView.amount).mapWith(Number)
// 					: count(journalExtendedView.id).mapWith(Number)
// 		})
// 		.from(journalExtendedView)
// 		.where(and(...[...filtersAll, lt(journalExtendedView.dateText, earliestDate.toISOString())]))
// 		.execute();

// 	const beforeAmount = beforeAmountResult[0].total;

// 	const returnData = data.map((d, i) => {
// 		const runningTotal = data.slice(0, i).reduce((acc, cur) => acc + cur.amount, 0);
// 		const adder = sumFromStart ? runningTotal + beforeAmount : runningTotal;

// 		const amount = useRunningTotal ? d.amount + adder : d.amount;

// 		return {
// 			x: d.time,
// 			amount
// 		};
// 	});

// 	return returnData;
// };

// export type SingleTimeSeriesData = ReturnType<typeof getSingleTimeSeriesData>;

// const getTotal = async ({
// 	db,
// 	filters,
// 	type
// }: {
// 	db: DBType;
// 	filters: SQL<unknown>[];
// 	type: 'sum' | 'count';
// }) => {
// 	if (type === 'sum') {
// 		const data = await db
// 			.select({ sum: sum(journalExtendedView.amount).mapWith(Number) })
// 			.from(journalExtendedView)
// 			.where(filters.length > 0 ? and(...filters) : sql`true`)
// 			.execute();

// 		return data[0].sum;
// 	}
// 	const data = await db
// 		.select({ count: count(journalExtendedView.id) })
// 		.from(journalExtendedView)
// 		.where(filters.length > 0 ? and(...filters) : sql`true`)
// 		.execute();

// 	return data[0].count;
// };

// export type ReportElementNumberData = ReturnType<typeof getNumberData>;
