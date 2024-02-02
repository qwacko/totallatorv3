import type { DBType } from '$lib/server/db/db';
import type { GetNumberFromFilterKeyType } from './getData';
import { mathConfigToNumber } from './mathConfigToNumber';

export const stringConfigToString = async ({
	db,
	stringConfig,
	allowableFilters,
	getNumberFromKey,
	numberDisplay
}: {
	db: DBType;
	stringConfig: string;
	allowableFilters: string[];
	getNumberFromKey: GetNumberFromFilterKeyType;
	numberDisplay: 'number' | 'currency' | 'percent';
}) => {
	let stringConfigInt = stringConfig;

	console.log('String Config : ', stringConfigInt);

	//Extract all the replacements from stringConfig which are identified by being surrpounded by vertical lines
	const replacements = stringConfigInt.match(/\|([^|]+)\|/g);

	console.log('Replacements : ', replacements);

	//Handle the replacement of strings
	if (replacements) {
		for (const replacement of replacements) {
			console.log('Current Filter : ', replacement);

			const replacementTarget = replacement.replace(/\|/g, '');
			const replacementKey = replacementTarget.trim();

			const replacementNumber = await mathConfigToNumber({
				db,
				mathConfig: replacementKey,
				allowableFilters,
				getNumberFromKey
			});

			if ('errorMessage' in replacementNumber) {
				return {
					error: true,
					errorMessage: `Error getting number from filter key: ${replacementKey}`
				};
			}

			const replacementNumberString =
				numberDisplay === 'currency'
					? replacementNumber.value?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
					: numberDisplay === 'number'
						? replacementNumber.value?.toLocaleString('en-US', {
								style: 'decimal',
								maximumFractionDigits: 0
							})
						: `${replacementNumber.value?.toLocaleString('en-US', {
								style: 'decimal',
								maximumFractionDigits: 2
							})}%`;

			console.log('Replacement Number : ', replacementNumberString);

			stringConfigInt = stringConfigInt.replace(replacement, replacementNumberString);

			// const filterTarget = filter.replace(/{|}/g, '');
			// const filterKey = filterTarget.trim();
			// if (!allowableFilters.includes(filterKey)) {
			// 	return {
			// 		error: true,
			// 		errorMessage: `Filter "${filterKey}" not allowed in Config.`
			// 	};
			// }

			// const replacementNumber = await getNumberFromKey(filterKey);
			// if ('errorMessage' in replacementNumber) {
			// 	return { error: true, errorMessage: `Error getting number from filter key: ${filterKey}` };
			// }

			// mathConfigInt = mathConfigInt.replace(filter, (replacementNumber.value || 0).toString());
		}
	}

	return { value: stringConfigInt };
};
