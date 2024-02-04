import type { DBType } from '$lib/server/db/db';
import type { GetDataForFilterKeyType } from './getCombinedFilters';
import { mathConfigToNumber } from './mathConfigToNumber';

export const stringConfigToString = async ({
	db,
	stringConfig,
	getDataFromKey,
	numberDisplay
}: {
	db: DBType;
	stringConfig: string;
	getDataFromKey: GetDataForFilterKeyType;
	numberDisplay: 'number' | 'currency' | 'percent';
}) => {
	let stringConfigInt = stringConfig;

	//Extract all the replacements from stringConfig which are identified by being surrpounded by vertical lines
	const replacements = stringConfigInt.match(/\|([^|]+)\|/g);

	//Handle the replacement of strings
	if (replacements) {
		for (const replacement of replacements) {
			const replacementTarget = replacement.replace(/\|/g, '');
			const replacementKey = replacementTarget.trim();

			const replacementNumber = await mathConfigToNumber({
				db,
				mathConfig: replacementKey,
				getDataFromKey
			});

			if ('errorMessage' in replacementNumber) {
				return {
					error: true,
					errorMessage: replacementNumber.errorMessage
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
		}
	}

	return { value: stringConfigInt };
};
