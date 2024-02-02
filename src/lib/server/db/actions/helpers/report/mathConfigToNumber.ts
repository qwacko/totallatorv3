import type { DBType } from '$lib/server/db/db';
import { evaluate } from 'mathjs';
import type { GetNumberFromFilterKeyType } from './getData';

export const mathConfigToNumber = async ({
	db,
	mathConfig,
	allowableFilters,
	getNumberFromKey
}: {
	db: DBType;
	mathConfig: string;
	allowableFilters: string[];
	getNumberFromKey: GetNumberFromFilterKeyType;
}) => {
	let mathConfigInt = mathConfig;

	//Extract all the filtesr from mathConfig which are identified by being surrpounded by curly braces
	const filters = mathConfigInt.match(/{([^}]+)}/g);

	//Check if the filters are allowed
	if (filters) {
		for (const filter of filters) {
			const filterTarget = filter.replace(/{|}/g, '');
			const filterKey = filterTarget.trim();
			if (!allowableFilters.includes(filterKey)) {
				return {
					error: true,
					errorMessage: `Filter "${filterKey}" not allowed in Config.`
				};
			}

			const replacementNumber = await getNumberFromKey(filterKey);
			if ('errorMessage' in replacementNumber) {
				return { error: true, errorMessage: `Error getting number from filter key: ${filterKey}` };
			}

			mathConfigInt = mathConfigInt.replace(filter, (replacementNumber.value || 0).toString());
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
