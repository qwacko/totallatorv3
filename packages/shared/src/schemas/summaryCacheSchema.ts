import * as z from 'zod';

const summaryItemDetails = z.object({
	id: z.string().nullable().optional(),
	title: z.string().nullable().optional(),
	count: z.coerce.number<number>(),
	sum: z.coerce.number<number>(),
	sum12Months: z.coerce.number<number>(),
	sum12MonthsWithoutTransfer: z.coerce.number<number>(),
	sumWithoutTransfer: z.coerce.number<number>(),
	earliest: z.coerce.string<string>(),
	latest: z.coerce.string<string>(),
	average: z.coerce.number<number>(),
	lastUpdated: z.coerce.date()
});

export type SummaryItemDetailsType = z.infer<typeof summaryItemDetails>;

const monthlySummarySchema = z.object({
	sum: z.coerce.number<number>(),
	average: z.coerce.number<number>(),
	count: z.coerce.number<number>(),
	negativeCount: z.coerce.number<number>(),
	positiveCount: z.coerce.number<number>(),
	negativeSum: z.coerce.number<number>(),
	positiveSum: z.coerce.number<number>(),
	positiveSumNonTransfer: z.coerce.number<number>(),
	negativeSumNonTransfer: z.coerce.number<number>(),
	yearMonth: z.coerce.string<string>(),
	runningTotal: z.coerce.number<number>(),
	runningCount: z.coerce.number<number>()
});

export const summaryCacheDataSchema = z.object({
	...summaryItemDetails.shape,

	tags: z.array(summaryItemDetails),
	categories: z.array(summaryItemDetails),
	bills: z.array(summaryItemDetails),
	budgets: z.array(summaryItemDetails),
	accounts: z.array(summaryItemDetails),
	monthlySummary: z.array(monthlySummarySchema)
});

export const summaryCacheSchema = z.object({
	id: z.string(),
	data: summaryCacheDataSchema
});

export type SummaryCacheSchemaType = z.infer<typeof summaryCacheSchema>;
export type SummaryCacheSchemaDataType = z.infer<typeof summaryCacheDataSchema>;
export type MonthlySummarySchemaType = z.infer<typeof monthlySummarySchema>;
