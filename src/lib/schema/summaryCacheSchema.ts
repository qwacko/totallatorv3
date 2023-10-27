import { z } from 'zod';

const summaryItemDetails = z.object({
	id: z.string().nullable().optional(),
	title: z.string().nullable().optional(),
	count: z.coerce.number(),
	sum: z.coerce.number(),
	sum12Months: z.coerce.number(),
	sum12MonthsWithoutTransfer: z.coerce.number(),
	sumWithoutTransfer: z.coerce.number(),
	earliest: z.coerce.string(),
	latest: z.coerce.string(),
	average: z.coerce.number(),
	lastUpdated: z.coerce.date()
});

export type SummaryItemDetailsType = z.infer<typeof summaryItemDetails>;

const monthlySummarySchema = z.object({
	sum: z.coerce.number(),
	average: z.coerce.number(),
	count: z.coerce.number(),
	negativeCount: z.coerce.number(),
	positiveCount: z.coerce.number(),
	negativeSum: z.coerce.number(),
	positiveSum: z.coerce.number(),
	positiveSumNonTransfer: z.coerce.number(),
	negativeSumNonTransfer: z.coerce.number(),
	yearMonth: z.coerce.string(),
	runningTotal: z.coerce.number(),
	runningCount: z.coerce.number()
});

export const summaryCacheDataSchema = summaryItemDetails.merge(
	z.object({
		tags: z.array(summaryItemDetails),
		categories: z.array(summaryItemDetails),
		bills: z.array(summaryItemDetails),
		budgets: z.array(summaryItemDetails),
		accounts: z.array(summaryItemDetails),
		monthlySummary: z.array(monthlySummarySchema)
	})
);

export const summaryCacheSchema = z.object({
	id: z.string(),
	data: summaryCacheDataSchema
});

export type SummaryCacheSchemaType = z.infer<typeof summaryCacheSchema>;
export type SummaryCacheSchemaDataType = z.infer<typeof summaryCacheDataSchema>;
export type MonthlySummarySchemaType = z.infer<typeof monthlySummarySchema>;
