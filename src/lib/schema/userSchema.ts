export const currencyFormatEnum = ['USD', 'GBP', 'INR', 'AUD', 'EUR'] as const;
export const dateFormatEnum = [
	'YYYY-MM-DD',
	'MM/DD/YY',
	'MM/DD/YYYY',
	'DD/MM/YY',
	'DD/MM/YYYY'
] as const;

export type currencyFormatType = (typeof currencyFormatEnum)[number];
export type dateFormatType = (typeof dateFormatEnum)[number];

const formatLookup: Record<
	currencyFormatType,
	{
		formatter: Intl.NumberFormat;
	}
> = {
	AUD: {
		formatter: new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })
	},
	USD: {
		formatter: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
	},

	GBP: {
		formatter: new Intl.NumberFormat('en-GB', {
			style: 'currency',
			currency: 'GBP'
		})
	},
	EUR: {
		formatter: new Intl.NumberFormat('en-DE', {
			style: 'currency',
			currency: 'EUR'
		})
	},
	INR: {
		formatter: new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR'
		})
	}
};

export const getCurrencyFormatter = (format: currencyFormatType) => {
	const formatter = formatLookup[format];
	return formatter.formatter;
};
