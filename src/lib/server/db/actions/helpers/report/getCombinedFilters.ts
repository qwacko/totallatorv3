import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
import type { DBType } from '$lib/server/db/db';
import { sum, and, count, min, max, avg, SQL, asc, sql, eq } from 'drizzle-orm';
import { filtersToSQLWithDateRange } from './filtersToSQLWithDateRange';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
import { journalExtendedView } from '$lib/server/db/postgres/schema/materializedViewSchema';
import type { DateRangeType, ConfigFilters } from './getData';
import type { TimeGroupingType } from '$lib/schema/reportHelpers/timeGroupingEnum';
import { generateDateItemsBetween } from '$lib/helpers/generateDateItemsBetween';

export const getCombinedFilters = ({
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

	const filterOptions = [
		...(allowCommonFilters ? ['filterall'] : []),
		...configFilters.map((configFilter) => {
			return `filter${configFilter.order}`;
		})
	];

	const groupingEnum = ['single', 'time'] as const;
	const resultEnum = ['sum', 'count', 'min', 'max', 'avg'] as const;
	const timeSeriesEnum = ['runningtotal', 'single'] as const;
	const singleResultEnum = ['beforerange', 'withinrange', 'uptorangeend'] as const;

	type GroupingEnumType = (typeof groupingEnum)[number];
	type ResultEnumType = (typeof resultEnum)[number];
	type TimeSeriesEnumType = (typeof timeSeriesEnum)[number];
	type SingleResultEnumType = (typeof singleResultEnum)[number];

	const getFilterForTimeSeries = async (filterType: string) => {
		const thisFilter = configFilters.find((x) => x.order === Number(filterType.slice(6)))?.filter
			.filter;

		const useFilters =
			filterType === 'filterall'
				? commonFilters
				: filterNullUndefinedAndDuplicates([...commonFilters, thisFilter]);

		return await filtersToSQLWithDateRange({
			db,
			filters: useFilters,
			dateRangeFilter: {
				dateBefore: dateRange.end.toISOString(),
				dateAfter: dateRange.start.toISOString()
			}
		});
	};

	const getFilterForSingleResult = async (resultType: SingleResultEnumType, filterType: string) => {
		const useDateRange =
			resultType === 'withinrange'
				? {
						dateBefore: dateRange.end.toISOString(),
						dateAfter: dateRange.start.toISOString()
					}
				: resultType === 'uptorangeend'
					? {
							dateBefore: dateRange.end.toISOString()
						}
					: resultType === 'beforerange'
						? {
								dateBefore: dateRange.start.toISOString()
							}
						: {};

		const thisFilter = configFilters.find((x) => x.order === Number(filterType.slice(6)))?.filter
			.filter;

		const useFilters =
			filterType === 'filterall'
				? commonFilters
				: filterNullUndefinedAndDuplicates([...commonFilters, thisFilter]);

		return await filtersToSQLWithDateRange({
			db,
			filters: useFilters,
			dateRangeFilter: useDateRange
		});
	};

	const getSingleNumber = async ({
		db,
		resultType,
		filters
	}: {
		db: DBType;
		filters: SQL<unknown>[];
		resultType: ResultEnumType;
	}) => {
		const dbData = await db
			.select({
				value:
					resultType === 'sum'
						? sum(journalExtendedView.amount).mapWith(Number)
						: resultType === 'count'
							? count(journalExtendedView.id).mapWith(Number)
							: resultType === 'min'
								? min(journalExtendedView.amount).mapWith(Number)
								: resultType === 'max'
									? max(journalExtendedView.amount).mapWith(Number)
									: resultType === 'avg'
										? avg(journalExtendedView.amount).mapWith(Number)
										: sum(journalExtendedView.amount).mapWith(Number)
			})
			.from(journalExtendedView)
			.where(and(...filters))
			.execute();

		if (!dbData[0]) {
			return { errorMessage: 'No data found' };
		}

		return { value: dbData[0].value };
	};

	const getUngroupedTimeSeriesData = async ({
		db,
		filters,
		timeGrouping,
		type,
		resultType
	}: {
		db: DBType;
		filters: SQL<unknown>[];
		timeGrouping: TimeGroupingType;
		type: TimeSeriesEnumType;
		resultType: ResultEnumType;
	}) => {
		const dateOptions = generateDateItemsBetween({
			startDate: dateRange.start.toISOString().slice(0, 10),
			endDate: dateRange.end.toISOString().slice(0, 10),
			timeUnit: timeGrouping
		});

		const dateSeries = db
			.$with('date_series')
			.as((qb) =>
				qb
					.select({ dateSeries: sql<string>`date_series.date_text`.as('date_text_series') })
					.from(sql.raw(`(VALUES ('${dateOptions.join("'), ('")}')) AS date_series(date_text)`))
			);

		const dbData = await db
			.with(dateSeries)
			.select({
				time: dateSeries.dateSeries,
				value:
					resultType === 'sum'
						? sum(journalExtendedView.amount).mapWith(Number)
						: resultType === 'count'
							? count(journalExtendedView.id).mapWith(Number)
							: resultType === 'min'
								? min(journalExtendedView.amount).mapWith(Number)
								: resultType === 'max'
									? max(journalExtendedView.amount).mapWith(Number)
									: resultType === 'avg'
										? avg(journalExtendedView.amount).mapWith(Number)
										: sum(journalExtendedView.amount).mapWith(Number)
			})
			.from(dateSeries)
			.leftJoin(
				journalExtendedView,
				and(
					eq(
						timeGrouping === 'month'
							? journalExtendedView.yearMonth
							: timeGrouping === 'year'
								? journalExtendedView.year
								: timeGrouping === 'day'
									? journalExtendedView.yearMonthDay
									: timeGrouping === 'quarter'
										? journalExtendedView.yearQuarter
										: journalExtendedView.yearWeek,
						dateSeries.dateSeries
					),
					...filters
				)
			)
			.orderBy(asc(dateSeries.dateSeries))
			.groupBy(dateSeries.dateSeries)
			.execute();

		if (type === 'single') {
			return { value: dbData.map((item) => ({ ...item, value: item.value || 0 })) };
		}
		if (type === 'runningtotal') {
			let runningTotal = 0;
			const runningTotalData = dbData.map((data) => {
				runningTotal += data.value || 0;
				return { time: data.time, value: runningTotal };
			});
			return { value: runningTotalData };
		}

		return { errorMessage: 'Something Has Gone Wrong' };
	};

	const getDataForFilterKey = async ({
		db,
		key,
		allowSingle = true,
		allowTime = true,
		timeGrouping = 'month'
	}: {
		db: DBType;
		key: string;
		allowSingle?: boolean;
		allowTime?: boolean;
		timeGrouping?: TimeGroupingType;
	}) => {
		const [dataGrouping, filterIn, item3, resultIn] = key.toLowerCase().split('.');

		const grouping = groupingEnum.includes(dataGrouping as GroupingEnumType)
			? (dataGrouping as GroupingEnumType)
			: null;

		const filter = filterOptions.includes(filterIn) ? filterIn : null;
		const outputCalc = resultEnum.includes(resultIn as ResultEnumType)
			? (resultIn as ResultEnumType)
			: null;

		if (!grouping) {
			return {
				error: true,
				errorMessage: `Data Grouping "${dataGrouping}" not found in ${groupingEnum.join(', ')}`
			};
		}

		if (!filter) {
			return {
				error: true,
				errorMessage: `Filter "${filterIn}" not found in ${filterOptions.join(', ')}`
			};
		}

		if (!outputCalc) {
			return {
				error: true,
				errorMessage: `Output Calculation "${resultIn}" not found in ${resultEnum.join(', ')}`
			};
		}

		if (grouping === 'single') {
			if (!allowSingle) {
				return {
					error: true,
					errorMessage: `Single grouping not allowed`
				};
			}

			const timeSpan = singleResultEnum.includes(item3 as SingleResultEnumType)
				? (item3 as SingleResultEnumType)
				: null;

			if (!timeSpan) {
				return {
					error: true,
					errorMessage: `Time Span "${item3}" not found in ${singleResultEnum.join(', ')}`
				};
			}

			const filtersToUse = await getFilterForSingleResult(timeSpan, filter);

			const singleNumber = await getSingleNumber({
				db,
				filters: filtersToUse,
				resultType: outputCalc
			});

			if ('errorMessage' in singleNumber) {
				return {
					error: true,
					errorMessage: singleNumber.errorMessage
				};
			}

			return {
				singleValue: singleNumber.value
			};
		}

		if (grouping === 'time') {
			if (!allowTime) {
				return {
					error: true,
					errorMessage: `Time grouping not allowed`
				};
			}

			const timeSpan = timeSeriesEnum.includes(item3 as TimeSeriesEnumType)
				? (item3 as TimeSeriesEnumType)
				: null;

			if (!timeSpan) {
				return {
					error: true,
					errorMessage: `Time Span "${item3}" not found in ${timeSeriesEnum.join(', ')}`
				};
			}

			const filtersToUse = await getFilterForTimeSeries(filterIn);
			const data = await getUngroupedTimeSeriesData({
				db,
				filters: filtersToUse,
				timeGrouping,
				type: timeSpan,
				resultType: outputCalc
			});

			if ('errorMessage' in data) {
				return {
					error: true,
					errorMessage: data.errorMessage
				};
			}

			return {
				timeSeriesData: data.value
			};
		}

		return {
			error: true,
			errorMessage: `Unknown Error`
		};
	};

	return getDataForFilterKey;
};

export type GetDataForFilterKeyType = ReturnType<typeof getCombinedFilters>;
