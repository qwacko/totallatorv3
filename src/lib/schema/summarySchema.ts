import { z } from 'zod';

export const summaryFilterProperties = {
	countMax: z.number().optional(),
	countMin: z.number().optional(),
	totalMax: z.number().optional(),
	totalMin: z.number().optional(),
	firstDateMin: z.date().optional(),
	firstDateMax: z.date().optional(),
	lastDateMin: z.date().optional(),
	lastDateMax: z.date().optional()
};

export const summaryFilterSchema = z.object(summaryFilterProperties);

export type SummaryFilterSchemaType = z.infer<typeof summaryFilterSchema>;

export const summaryOrderByEnum = ['sum', 'count', 'firstDate', 'lastDate'] as const;
type OrderByEnumType = (typeof summaryOrderByEnum)[number];

type OrderByEnumTitles = {
	[K in OrderByEnumType]: string;
};

export const summaryEnumTitles = {
	sum: 'Sum',
	count: 'Count',
	firstDate: 'First Date',
	lastDate: 'Last Date'
} satisfies OrderByEnumTitles;
