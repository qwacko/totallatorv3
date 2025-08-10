import * as z from 'zod';

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

export const formatDate = (date: Date, format: dateFormatType) => {
	if (format === 'YYYY-MM-DD') {
		return date.toISOString().split('T')[0];
	}

	if (format === 'MM/DD/YY') {
		return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(2)}`;
	}

	if (format === 'MM/DD/YYYY') {
		return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
	}

	if (format === 'DD/MM/YY') {
		return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
	}

	if (format === 'DD/MM/YYYY') {
		return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
	}

	return date.toISOString().split('T')[0];
};

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

export const updateUserSchema = z.object({
	name: z.string().optional(),
	currencyFormat: z.enum(currencyFormatEnum).optional(),
	dateFormat: z.enum(dateFormatEnum).optional()
});

export type updateUserSchemaType = z.infer<typeof updateUserSchema>;
