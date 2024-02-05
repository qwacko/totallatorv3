import type { ReportConfigPartNumberDisplayType } from '$lib/schema/reportHelpers/reportConfigPartNumberDisplayEnum';
import type { currencyFormatType } from '$lib/schema/userSchema';
import type { DBType } from '$lib/server/db/db';
import { convertNumberToText } from '../../../../../helpers/convertNumberToText';
import type { GetDataForFilterKeyType } from './getCombinedFilters';
import { mathConfigToNumber } from './mathConfigToNumber';

export const stringConfigToString = async ({
	db,
	stringConfig,
	getDataFromKey,
	numberDisplay,
	currency
}: {
	db: DBType;
	stringConfig: string;
	getDataFromKey: GetDataForFilterKeyType;
	numberDisplay: ReportConfigPartNumberDisplayType;
	currency: currencyFormatType;
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

			const replacementNumberString = convertNumberToText({
				value: replacementNumber.value,
				config: numberDisplay,
				currency
			});

			stringConfigInt = stringConfigInt.replace(replacement, replacementNumberString);
		}
	}

	return { value: stringConfigInt };
};
