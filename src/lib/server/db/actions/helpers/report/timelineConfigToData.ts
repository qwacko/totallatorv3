import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
import type { ReportConfigPartSchemaTimeGraphType } from '$lib/schema/reportHelpers/reportConfigPartSchema';
import type { DBType } from '$lib/server/db/db';
import { evaluate } from 'mathjs';
import type { GetDataForFilterKeyType } from './getCombinedFilters';
import { getFiltersFromMathConfig } from './mathConfigToNumber';
import { type currencyFormatType } from '$lib/schema/userSchema';
import { convertNumberToText } from '../../../../../helpers/convertNumberToText';

export const timelineConfigToData = async ({
	db,
	config,
	getDataFromKey,
	currency
}: {
	db: DBType;
	config: ReportConfigPartSchemaTimeGraphType;
	getDataFromKey: GetDataForFilterKeyType;
	currency: currencyFormatType;
}) => {
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
				timeGrouping: config.timeGrouping,
				dataGrouping: config.itemGrouping
			});

			if ('errorMessage' in filterResult) {
				errorMessage = filterResult.errorMessage;
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
					: filterResult.data.singleValue.map((item) => item.group)
			)
			.flat()
			.map((item) => item || 'None')
	);

	// Step 1: Preprocess the filterResults into a hash map for faster lookup
	const filterResultsByGroupAndDate: Record<string, { key: string; value: number }[]> = {};
	filterResults.forEach((filterResult) => {
		if (filterResult.data.timeSeriesData) {
			filterResult.data.timeSeriesData.forEach((item) => {
				const key = `${item.group || 'None'}-${item.time}`;
				if (!filterResultsByGroupAndDate[key]) {
					filterResultsByGroupAndDate[key] = [];
				}
				filterResultsByGroupAndDate[key].push({ key: filterResult.key, value: item.value });
			});
		}
		if (filterResult.data.singleValue) {
			filterResult.data.singleValue.forEach((item) => {
				dateSeries.map((time) => {
					const key = `${item.group || 'None'}-${time}`;
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
				console.log('Error in calculation', err);
				// Handle error or set calcValue to a default
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

	const groupedDataUsed = filterNullUndefinedAndDuplicates(groupedData);

	if (errorMessage) {
		return { error: true, errorMessage };
	}

	return { data: groupedDataUsed, title: 'Grouped Data' };
};
