import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
import type { ReportConfigPartSchemaSparklineType } from '$lib/schema/reportHelpers/reportConfigPartSchema';
import type { DBType } from '$lib/server/db/db';
import { evaluate } from 'mathjs';
import type { GetDataForFilterKeyType } from './getCombinedFilters';
import { getFiltersFromMathConfig } from './mathConfigToNumber';
import { type currencyFormatType } from '$lib/schema/userSchema';
import { convertNumberToText } from '../../../../../helpers/convertNumberToText';

export const sparklineConfigToData = async ({
	db,
	config,
	getDataFromKey,
	currency
}: {
	db: DBType;
	config: ReportConfigPartSchemaSparklineType;
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
				timeGrouping: config.timeGrouping
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

	const dateData = dateSeries.map((date) => {
		const dateData = filterResults.map((filterResult) => {
			if (filterResult.data.timeSeriesData) {
				const timeSeriesData = filterResult.data.timeSeriesData.find((item) => item.time === date);
				return { key: filterResult.key, value: timeSeriesData ? timeSeriesData.value : 0 };
			}
			if (filterResult.data.singleValue) {
				return { key: filterResult.key, value: filterResult.data.singleValue[0].value || 0 };
			}

			return {
				key: filterResult.key,
				value: 0,
				textValue: convertNumberToText({ value: 0, config: config.numberDisplay, currency })
			};
		});

		let currentCalc = config.mathConfig;

		filters.map((filter) => {
			currentCalc = currentCalc.replaceAll(
				filter.targetText,
				dateData.find((item) => item.key === filter.targetFilter)?.value.toString() || '0'
			);
		});

		try {
			const calcValue = Number(evaluate(currentCalc));
			return {
				time: date,
				value: calcValue,
				textValue: convertNumberToText({ value: calcValue, config: config.numberDisplay, currency })
			};
		} catch (err) {
			console.log('Error in Sparkline Config To Data', err);
			errorMessage = `Math Request Malformed. Query = ${currentCalc}`;
			return {
				time: date,
				value: 0,
				textValue: convertNumberToText({ value: 0, config: config.numberDisplay, currency })
			};
		}
	});

	if (errorMessage) {
		return { error: true, errorMessage };
	}

	return { data: dateData, title: 'Sparkline Data' };
};
