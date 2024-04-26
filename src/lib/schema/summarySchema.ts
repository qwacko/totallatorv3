import { z } from 'zod';
import { dateStringSchema } from './dateStringSchema';
import type { currencyFormatType } from './userSchema';

export const summaryFilterProperties = {
	countMax: z.number().optional(),
	countMin: z.number().optional(),
	totalMax: z.number().optional(),
	totalMin: z.number().optional(),
	firstDateMin: dateStringSchema.optional().nullable(),
	firstDateMax: dateStringSchema.optional().nullable(),
	lastDateMin: dateStringSchema.optional().nullable(),
	lastDateMax: dateStringSchema.optional().nullable()
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

type RowType = {
	sum: number | undefined | null;
	count: number | undefined | null;
	firstDate: Date | undefined | null;
	lastDate: Date | undefined | null;
};

type SummaryColumnsType = {
	id: string;
	title: string;
	sortKey: string;
	rowToDisplay?: (data: RowType) => string;
	rowToCurrency?: (data: RowType) => { amount: number };
	showTitleOnMobile?: boolean;
}[];

export const summaryColumns = ({ currencyFormat }: { currencyFormat?: currencyFormatType }) => {
	return [
		{
			id: 'total' as const,
			title: 'Total',
			rowToCurrency: (row) => ({
				amount: row.sum || 0
			}),
			sortKey: 'sum' as const,
			showTitleOnMobile: true
		},
		{
			id: 'count' as const,
			title: 'Count',
			rowToDisplay: (row) => (row.count || 0).toString(),
			sortKey: 'count' as const,
			showTitleOnMobile: true
		},
		{
			id: 'firstDate' as const,
			title: 'First',
			rowToDisplay: (row) => (row.firstDate ? row.firstDate.toISOString().slice(0, 10) : ''),
			sortKey: 'firstDate' as const,
			showTitleOnMobile: true
		},
		{
			id: 'lastDate' as const,
			title: 'Last',
			rowToDisplay: (row) => (row.lastDate ? row.lastDate.toISOString().slice(0, 10) : ''),
			sortKey: 'lastDate' as const,
			showTitleOnMobile: true
		}
	] satisfies SummaryColumnsType;
};
