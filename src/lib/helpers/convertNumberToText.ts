import type { ReportConfigPartNumberDisplayType } from '$lib/schema/reportHelpers/reportConfigPartNumberDisplayEnum';
import { getCurrencyFormatter, type currencyFormatType } from '$lib/schema/userSchema';

export const convertNumberToText = ({
	value,
	config,
	currency
}: {
	value: number;
	config: ReportConfigPartNumberDisplayType;
	currency: currencyFormatType;
}) => {
	if (config === 'percent') {
		return `${value.toFixed(0)}%`;
	}
	if (config === 'percent2dp') {
		return `${value.toFixed(2)}%`;
	}
	if (config === 'currency') {
		const formatter = getCurrencyFormatter(currency);
		return formatter.format(value);
	}
	if (config === 'number2dp') return value.toFixed(2);

	return value.toFixed(0);
};
