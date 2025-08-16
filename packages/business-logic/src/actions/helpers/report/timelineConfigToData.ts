import { filterNullUndefinedAndDuplicates } from '@/helpers/filterNullUndefinedAndDuplicates';
import type { ReportConfigPartSchemaTimeGraphType } from '@totallator/shared';
import type { DBType } from '@totallator/database';
import { evaluate } from 'mathjs';
import type { GetDataForFilterKeyType } from './getCombinedFilters';
import { getFiltersFromMathConfig } from './getFiltersFromMathConfig';
import { reportConfigPartTrendDisplayInfo } from '@totallator/shared';
import { reportConfigPartItemGroupingInfo } from '@totallator/shared';
import { getLogger } from '@/logger';

export const timelineConfigToData = async ({
	db,
	config,
	getDataFromKey
}: {
	db: DBType;
	config: ReportConfigPartSchemaTimeGraphType;
	getDataFromKey: GetDataForFilterKeyType;
}) => {
	const trendDisplayConfig = reportConfigPartTrendDisplayInfo[config.trendDisplay];
	const nullGroupingTitle =
		reportConfigPartItemGroupingInfo[config.itemGrouping || 'none'].emptyTitle;
	const filters = getFiltersFromMathConfig(config.mathConfig);

	const uniqueFilters = filterNullUndefinedAndDuplicates(filters.map((item) => item.targetFilter));

	let errorMessage: string | undefined = undefined;
	let dateKeys: string[][] = [];

	const filterResultsWithUndefined = await Promise.all(
		uniqueFilters.map(async (filter) => {
			const filterResult = await getDataFromKey({
				db,
				key: filter,
				allowSingle: true,
				allowTime: true,
				allowGrouping: false,
				timeGrouping: config.timeGrouping,
				dataGrouping: config.itemGrouping
			});

			if ('groupedData' in filterResult) {
				errorMessage = 'Grouped Data not allowed in Time Graph Query';
				return undefined;
			}

			if (filterResult.error) {
				errorMessage = filterResult.errorMessage as string;
				return undefined;
			}

			if ('timeSeriesData' in filterResult) {
				if (filterResult.timeSeriesData) {
					dateKeys.push(filterResult.timeSeriesData.map((item) => item.time));
				}
			}

			return { key: filter, data: filterResult };
		})
	);

	if (errorMessage) {
		return { error: true, errorMessage };
	}

	const filterResults = filterNullUndefinedAndDuplicates(filterResultsWithUndefined);
	const dateSeries = filterNullUndefinedAndDuplicates(dateKeys.flat()).sort();

	const groupTitles = filterNullUndefinedAndDuplicates(
		filterResults
			.map((filterResult) =>
				filterResult.data.timeSeriesData
					? filterResult.data.timeSeriesData.map((item) => item.group)
					: filterResult.data.singleValue
						? filterResult.data.singleValue.map((item) => item.group)
						: []
			)
			.flat()
			.map((item) => item || nullGroupingTitle)
	);

	// Step 1: Preprocess the filterResults into a hash map for faster lookup
	const filterResultsByGroupAndDate: Record<string, { key: string; value: number }[]> = {};
	filterResults.forEach((filterResult) => {
		if (filterResult.data.timeSeriesData) {
			filterResult.data.timeSeriesData.forEach((item) => {
				const key = `${item.group || nullGroupingTitle}-${item.time}`;
				if (!filterResultsByGroupAndDate[key]) {
					filterResultsByGroupAndDate[key] = [];
				}
				filterResultsByGroupAndDate[key].push({ key: filterResult.key, value: item.value });
			});
		}
		if (filterResult.data.singleValue) {
			filterResult.data.singleValue.forEach((item) => {
				dateSeries.map((time) => {
					const key = `${item.group || nullGroupingTitle}-${time}`;
					if (!filterResultsByGroupAndDate[key]) {
						filterResultsByGroupAndDate[key] = [];
					}
					filterResultsByGroupAndDate[key].push({ key: filterResult.key, value: item.value });
				});
			});
		}
	});

	// Step 2: Iterate over groupTitles and dateSeries more efficiently
	const groupedData = groupTitles.map((group) => {
		const dateData = dateSeries.map((date) => {
			// Utilize the preprocessed hash map for faster lookup
			const dateGroupKey = `${group}-${date}`;
			const groupKey = `${group}`;
			const dateData = filterResultsByGroupAndDate[dateGroupKey] ||
				filterResultsByGroupAndDate[groupKey] || [{ key: null, value: 0 }];

			// Simplify the calculation logic if applicable
			// Assuming filters is a list that influences currentCalc modification
			let currentCalc = config.mathConfig;
			filters.forEach((filter) => {
				const filterValue =
					dateData.find((item) => item.key === filter.targetFilter)?.value.toString() || '0';
				currentCalc = currentCalc.replaceAll(filter.targetText, filterValue);
			});

			let calcValue = 0;
			try {
				calcValue = Number(evaluate(currentCalc));
			} catch (err) {
				getLogger('reports').error(err, 'Error in calculation');
			}

			return {
				time: date,
				value: calcValue
			};
		});

		const dateDataNonZero = dateData.filter((item) => item.value !== 0).length > 0;

		//Remove traces if theay are zero through teh whole timeline.
		if (dateDataNonZero) {
			return { group, data: dateData };
		}

		return undefined;
	});

	if (errorMessage) {
		return { error: true, errorMessage };
	}

	const groupedDataUsed = filterNullUndefinedAndDuplicates(groupedData);

	const groupedDataWithoutNull = trendDisplayConfig.retainBlank
		? groupedDataUsed
		: groupedDataUsed.filter((item) => item.group !== nullGroupingTitle);

	if (trendDisplayConfig.retainTop === undefined) {
		return { data: groupedDataWithoutNull, title: 'Grouped Data' };
	}

	const groupedDataSorted = groupedDataWithoutNull
		.map((item) => {
			const maxAmount = item.data.reduce((acc, item) => Math.max(Math.abs(item.value), acc), 0);
			return {
				group: item.group,
				value: maxAmount
			};
		})
		.sort((a, b) => b.value - a.value)
		.slice(0, trendDisplayConfig.retainTop)
		.map((item) => item.group);

	if (groupedDataSorted.length < trendDisplayConfig.retainTop) {
		return { data: groupedDataWithoutNull, title: 'Grouped Data' };
	}

	const itemsToGroup = groupedDataWithoutNull.filter(
		(item) => !groupedDataSorted.includes(item.group)
	);

	const otherGrouped = {
		group: 'Other Items',
		data: dateSeries.map((date) => {
			let calcValue = 0;
			itemsToGroup.forEach((item) => {
				const dateData = item.data.find((item) => item.time === date);
				calcValue += dateData ? dateData.value : 0;
			});
			return {
				time: date,
				value: calcValue
			};
		})
	};

	const topItems = groupedDataWithoutNull.filter((item) => groupedDataSorted.includes(item.group));

	return { data: [...topItems, otherGrouped], title: 'Grouped Data' };
};
