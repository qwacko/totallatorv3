import { z } from 'zod';
import { reportConfigPartTypeEnum } from './reportConfigPartTypeEnum';
import { reportConfigPartTimeGroupingEnum } from './reportConfigPartTimeGroupingEnum';
import { reportConfigPartItemGroupingEnum } from './reportConfigPartItemGroupingEnum';
import { reportConfigPartNumberDisplayEnum } from './reportConfigPartNumberDisplayEnum';
import { reportConfigPartTrendDisplayEnum } from './reportConfigPartTrendDisplayOptions';

const reportConfigPartSchema_None = z.object({
	id: z.string(),
	order: z.number(),
	type: z.literal('none')
});

export type ReportConfigPartSchemaNoneType = z.infer<typeof reportConfigPartSchema_None>;

const reportConfigPartSchema_NumberCurrency = z.object({
	id: z.string(),
	order: z.number(),
	type: z.literal('number'),
	mathConfig: z.string(),
	numberDisplay: z.enum(reportConfigPartNumberDisplayEnum).default('number')
});

export type ReportConfigPartSchemaNumberCurrencyType = z.infer<
	typeof reportConfigPartSchema_NumberCurrency
>;

const reportConfigPartSchema_String = z.object({
	id: z.string(),
	order: z.number(),
	type: z.literal('string'),
	stringConfig: z.string(),
	numberDisplay: z.enum(reportConfigPartNumberDisplayEnum).default('number')
});

export type ReportConfigPartSchemaStringType = z.infer<typeof reportConfigPartSchema_String>;

const reportConfigPartSchema_Sparkline = z.object({
	id: z.string(),
	order: z.number(),
	type: z.literal('sparkline').or(z.literal('sparklinebar')),
	mathConfig: z.string(),
	timeGrouping: z.enum(reportConfigPartTimeGroupingEnum).default('month'),
	numberDisplay: z.enum(reportConfigPartNumberDisplayEnum).default('number')
});

export type ReportConfigPartSchemaSparklineType = z.infer<typeof reportConfigPartSchema_Sparkline>;

const reportConfigPartSchema_TimeGraph = z.object({
	id: z.string(),
	order: z.number(),
	type: z.literal('time_line').or(z.literal('time_stackedArea')).or(z.literal('time_bar')),
	mathConfig: z.string(),
	timeGrouping: z.enum(reportConfigPartTimeGroupingEnum).default('month'),
	itemGrouping: z.enum(reportConfigPartItemGroupingEnum).optional(),
	numberDisplay: z.enum(reportConfigPartNumberDisplayEnum).default('number'),
	trendDisplay: z.enum(reportConfigPartTrendDisplayEnum).default('all'),
	includeTotal: z.boolean().default(false)
});

export type ReportConfigPartSchemaTimeGraphType = z.infer<typeof reportConfigPartSchema_TimeGraph>;

const reportConfigPartSchema_NonTimeGraph = z.object({
	id: z.string(),
	order: z.number(),
	type: z.literal('pie').or(z.literal('box')).or(z.literal('bar')),
	mathConfig: z.string(),
	itemGrouping: z.enum(reportConfigPartItemGroupingEnum),
	numberDisplay: z.enum(reportConfigPartNumberDisplayEnum).default('number'),
	trendDisplay: z.enum(reportConfigPartTrendDisplayEnum).default('all')
});

export type ReportConfigPartSchemaNonTimeGraphType = z.infer<
	typeof reportConfigPartSchema_NonTimeGraph
>;

export const reportConfigPartIndividualSchema = z.union([
	reportConfigPartSchema_None,
	reportConfigPartSchema_NumberCurrency,
	reportConfigPartSchema_String,
	reportConfigPartSchema_Sparkline,
	reportConfigPartSchema_TimeGraph,
	reportConfigPartSchema_NonTimeGraph
]);

export type ReportConfigPartIndividualSchemaType = z.infer<typeof reportConfigPartIndividualSchema>;

export const reportConfigPartSchema = z.array(reportConfigPartIndividualSchema);
export type ReportConfigPartSchemaType = z.infer<typeof reportConfigPartSchema>;

export const reportConfigPartFormSchema = z.object({
	order: z.number(),
	type: z.enum(reportConfigPartTypeEnum),
	stringConfig: z.string().optional(),
	mathConfig: z.string().optional(),
	timeGrouping: z.enum(reportConfigPartTimeGroupingEnum).optional(),
	itemGrouping: z.enum(reportConfigPartItemGroupingEnum).optional(),
	numberDisplay: z.enum(reportConfigPartNumberDisplayEnum).optional(),
	trendDisplay: z.enum(reportConfigPartTrendDisplayEnum).optional(),
	includeTotal: z.boolean().default(false)
});

export type ReportConfigPartFormSchemaType = z.infer<typeof reportConfigPartFormSchema>;
export type ReportConfigPartFormSchemaSupertype = typeof reportConfigPartFormSchema;
