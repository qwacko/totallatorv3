import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
import type { DBType } from '$lib/server/db/db';
import { sum, type SQL, and, count, min, max, avg } from 'drizzle-orm';
import { filtersToSQLWithDateRange } from './filtersToSQLWithDateRange';
import { filtersToDateRange } from './filtersToDateRange';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
import type {
	ReportConfigPartIndividualSchemaType,
	ReportConfigPartSchemaNonTimeGraphType,
	ReportConfigPartSchemaNumberCurrencyType,
	ReportConfigPartSchemaSparklineType,
	ReportConfigPartSchemaStringType,
	ReportConfigPartSchemaTimeGraphType
} from '$lib/schema/reportHelpers/reportConfigPartSchema';
import { mathConfigToNumber } from './mathConfigToNumber';
import { journalExtendedView } from '$lib/server/db/postgres/schema/materializedViewSchema';
import { stringConfigToString } from './stringConfigToString';

type DateRangeType = ReturnType<typeof filtersToDateRange>;

type ConfigFilters = {
	id: string;
	order: number;
	filter: {
		id: string;
		filter: JournalFilterSchemaWithoutPaginationType;
	};
}[];

const getCombinedFilters = ({
	db,
	commonFilters,
	configFilters,
	dateRange
}: {
	db: DBType;
	dateRange: DateRangeType;
	commonFilters: JournalFilterSchemaWithoutPaginationType[];
	configFilters: ConfigFilters;
}) => {
	const allowCommonFilters = commonFilters.length > 0;

	const allowableFilters = [
		...(allowCommonFilters
			? [
					'FilterAll.all',
					'FilterAll.withinRange',
					'FilterAll.upToRangeEnd',
					'FilterAll.beforeRange'
				]
			: []),
		...configFilters.map((configFilter) => [
			`Filter${configFilter.order}.all`,
			`Filter${configFilter.order}.withinRange`,
			`Filter${configFilter.order}.upToRangeEnd`,
			`Filter${configFilter.order}.beforeRange`
		])
	].flat();

	const allowableFilterOptions = allowableFilters
		.map((key) => [`${key}.sum`, `${key}.count`, `${key}.min`, `${key}.max`, `${key}.avg`])
		.flat();

	// console.log('allowableFilterOptions', allowableFilterOptions);

	const getFilterFromKey = async (key: string) => {
		if (!allowableFilterOptions.includes(key)) {
			return null;
		}
		const [prefix, suffix, action] = key.split('.');

		const useDateRange =
			suffix === 'withinRange'
				? {
						dateBefore: dateRange.end.toISOString(),
						dateAfter: dateRange.start.toISOString()
					}
				: suffix === 'upToRangeEnd'
					? {
							dateBefore: dateRange.end.toISOString()
						}
					: suffix === 'beforeRange'
						? {
								dateBefore: dateRange.start.toISOString()
							}
						: {};

		const thisFilter = configFilters.find((x) => x.order === Number(prefix.slice(6)))?.filter
			.filter;

		const useFilters =
			prefix === 'FilterAll'
				? commonFilters
				: filterNullUndefinedAndDuplicates([...commonFilters, thisFilter]);

		return {
			filter: await filtersToSQLWithDateRange({
				db,
				filters: useFilters,
				dateRangeFilter: useDateRange
			}),
			action: action as 'sum' | 'count' | 'min' | 'max' | 'avg'
		};
	};

	const getNumberFromFilterKey = async (key: string) => {
		const filter = await getFilterFromKey(key);
		if (!filter) {
			return { errorMessage: "Couldn't find filter" };
		}

		const dbData = await db
			.select({
				value:
					filter.action === 'sum'
						? sum(journalExtendedView.amount).mapWith(Number)
						: filter.action === 'count'
							? count(journalExtendedView.id).mapWith(Number)
							: filter.action === 'min'
								? min(journalExtendedView.amount).mapWith(Number)
								: filter.action === 'max'
									? max(journalExtendedView.amount).mapWith(Number)
									: filter.action === 'avg'
										? avg(journalExtendedView.amount).mapWith(Number)
										: sum(journalExtendedView.amount).mapWith(Number)
			})
			.from(journalExtendedView)
			.where(and(...filter.filter))
			.execute();

		return { value: dbData[0].value };
	};

	return { allowableFilterOptions, getFilterFromKey, getNumberFromFilterKey };
};

export type GetNumberFromFilterKeyType = (
	key: string
) => Promise<{ value: number } | { errorMessage: string }>;

export const getItemData = ({
	db,
	config,
	filters,
	commonFilters
}: {
	db: DBType;
	config: ReportConfigPartIndividualSchemaType | null;
	commonFilters: JournalFilterSchemaWithoutPaginationType[];
	filters: ConfigFilters;
}) => {
	if (!config) return;

	const dateRange = filtersToDateRange(commonFilters);
	const {
		allowableFilterOptions: allowableFilters,
		getFilterFromKey,
		getNumberFromFilterKey: getNumberFromKey
	} = getCombinedFilters({
		commonFilters,
		configFilters: filters,
		db,
		dateRange
	});

	if (config.type === 'none') {
		return config;
	}

	const commonParametersReduced = {
		db,
		dateRange,
		allowableFilters
	};

	const commonParameters = {
		db,
		dateRange,
		allowableFilters,
		getFilterFromKey
	};

	if (config.type === 'number') {
		return getDataDetail.number({
			config,
			...commonParametersReduced,
			getNumberFromKey
		});
	}

	if (config.type === 'string') {
		return getDataDetail.string({ config, ...commonParametersReduced, getNumberFromKey });
	}

	if (config.type === 'sparkline' || config.type === 'sparklinebar') {
		return getDataDetail.sparkline({ config, ...commonParameters });
	}

	if (config.type === 'time_line' || config.type === 'time_stackedArea') {
		return getDataDetail.timeGraph({ config, ...commonParameters });
	}

	if (config.type === 'pie' || config.type === 'box' || config.type === 'bar') {
		return getDataDetail.nonTimeGraph({ config, ...commonParameters });
	}

	return config;

	throw Error("Couldn't find Report Element Type");
};

export type ReportElementItemData = ReturnType<typeof getItemData>;

type AllowableFilterType = string[];
export type GetFilterFromKeyType = (key: string) => Promise<{
	filter: SQL<unknown>[];
	action: 'sum' | 'count' | 'min' | 'max' | 'avg';
} | null>;

const getDataDetail = {
	number: ({
		db,
		config,
		allowableFilters,
		getNumberFromKey
	}: {
		db: DBType;
		dateRange: DateRangeType;
		config: ReportConfigPartSchemaNumberCurrencyType;
		allowableFilters: AllowableFilterType;
		getNumberFromKey: GetNumberFromFilterKeyType;
	}) => {
		const data = async () => {
			return mathConfigToNumber({
				db,
				mathConfig: config.mathConfig,
				allowableFilters,
				getNumberFromKey
			});
		};

		return { ...config, data: data() };
	},
	string: ({
		db,
		config,
		allowableFilters,
		getNumberFromKey
	}: {
		db: DBType;
		dateRange: DateRangeType;
		config: ReportConfigPartSchemaStringType;
		allowableFilters: AllowableFilterType;
		getNumberFromKey: GetNumberFromFilterKeyType;
	}) => {
		const data = async () => {
			return stringConfigToString({
				db,
				stringConfig: config.stringConfig,
				allowableFilters,
				getNumberFromKey,
				numberDisplay: config.numberDisplay
			});
		};

		return { ...config, data: data() };
	},
	sparkline: ({
		db,
		config
	}: {
		db: DBType;
		dateRange: DateRangeType;
		config: ReportConfigPartSchemaSparklineType;
		allowableFilters: AllowableFilterType;
		getFilterFromKey: GetFilterFromKeyType;
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
		config
	}: {
		db: DBType;
		dateRange: DateRangeType;
		config: ReportConfigPartSchemaTimeGraphType;
		allowableFilters: AllowableFilterType;
		getFilterFromKey: GetFilterFromKeyType;
	}) => {
		const data = async () => {};

		return { ...config, data: data() };
	},
	nonTimeGraph: ({
		db,
		config
	}: {
		db: DBType;
		config: ReportConfigPartSchemaNonTimeGraphType;
		allowableFilters: AllowableFilterType;
		getFilterFromKey: GetFilterFromKeyType;
	}) => {
		const data = async () => {};

		return { ...config, data: data() };
	}
};

export type ReportConfigPartWithData_NumberCurrency = ReturnType<typeof getDataDetail.number>;

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
