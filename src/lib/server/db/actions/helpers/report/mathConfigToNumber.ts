import type { DBType } from '$lib/server/db/db';
import { evaluate } from 'mathjs';
import type { GetDataForFilterKeyType } from './getCombinedFilters';

export const getFiltersFromMathConfig = (mathConfig: string) => {
	const filters = mathConfig.match(/{([^}]+)}/g);

	if (!filters) {
		return [];
	}

	return filters.map((filter) => ({
		targetText: filter,
		targetFilter: filter.replace(/{|}/g, '').trim()
	}));
};

export const mathConfigToNumber = async ({
	db,
	mathConfig,
	getDataFromKey
}: {
	db: DBType;
	mathConfig: string;
	getDataFromKey: GetDataForFilterKeyType;
}) => {
	let mathConfigInt = mathConfig;

	//Extract all the filtesr from mathConfig which are identified by being surrpounded by curly braces
	const filters = getFiltersFromMathConfig(mathConfigInt);

	//Check if the filters are allowed
	if (filters) {
		for (const filter of filters) {
			const filterKey = filter.targetFilter;
			const replacementNumber = await getDataFromKey({
				db,
				key: filterKey,
				allowSingle: true,
				allowTime: false
			});
			if ('errorMessage' in replacementNumber) {
				return { error: true, errorMessage: replacementNumber.errorMessage };
			}

			if ('timeSeriesData' in replacementNumber) {
				return { error: true, errorMessage: `Time Series Data not allowed in Single Result Query` };
			}

			mathConfigInt = mathConfigInt.replace(
				filter.targetText,
				(replacementNumber.singleValue || 0).toString()
			);
		}
	}

	try {
		const processedMathConfig = Number(evaluate(mathConfigInt));

		return { value: processedMathConfig };
	} catch (err) {
		// logging.error('Error Processing Math Request : ', { query: mathConfigInt, err });
		return { error: true, errorMessage: `Math Request Malformed. Query = ${mathConfigInt}` };
	}
};
