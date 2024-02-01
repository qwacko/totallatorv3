import { z } from 'zod';
import { reportConfigPartTypeEnum } from './reportConfigPartTypeEnum';

export const reportConfigPartTimeGroupingEnum = ['year', 'month', 'quarter', 'week'] as const;
export type ReportConfigPartTimeGroupingType = (typeof reportConfigPartTimeGroupingEnum)[number];

export const reportConfigPartTimeGroupingInfo = {
	year: {
		id: 'year',
		name: 'Year'
	},
	month: {
		id: 'month',
		name: 'Month'
	},
	quarter: {
		id: 'quarter',
		name: 'Quarter'
	},
	week: {
		id: 'week',
		name: 'Week'
	}
} satisfies {
	[key in ReportConfigPartTimeGroupingType]: {
		id: key;
		name: string;
	};
};

export type ReportConfigPartTimeGroupingInfoType = typeof reportConfigPartTimeGroupingInfo;

export const reportConfigPartTimeGroupingDropdown = Object.values(
	reportConfigPartTimeGroupingInfo
).map((option) => {
	return {
		name: option.name,
		value: option.id
	};
});

export const reportConfigPartItemGroupingEnum = [
	'account',
	'account_type',
	'tag',
	'category',
	'bill',
	'budget'
] as const;

export type ReportConfigPartItemGroupingType = (typeof reportConfigPartItemGroupingEnum)[number];

export const reportConfigPartItemGroupingInfo = {
	account: {
		id: 'account',
		name: 'Account'
	},
	account_type: {
		id: 'account_type',
		name: 'Account Type'
	},
	tag: {
		id: 'tag',
		name: 'Tag'
	},
	category: {
		id: 'category',
		name: 'Category'
	},
	bill: {
		id: 'bill',
		name: 'Bill'
	},
	budget: {
		id: 'budget',
		name: 'Budget'
	}
} satisfies {
	[key in ReportConfigPartItemGroupingType]: {
		id: key;
		name: string;
	};
};

export type ReportConfigPartItemGroupingInfoType = typeof reportConfigPartItemGroupingInfo;

export const reportConfigPartItemGroupingDropdown = Object.values(
	reportConfigPartItemGroupingInfo
).map((option) => {
	return {
		name: option.name,
		value: option.id
	};
});

const reportConfigPartSchema_None = z.object({
	id: z.string(),
	order: z.number(),
	type: z.literal('none')
});

export type ReportConfigPartSchemaNoneType = z.infer<typeof reportConfigPartSchema_None>;

const reportConfigPartSchema_NumberCurrency = z.object({
	id: z.string(),
	order: z.number(),
	type: z.literal('number').or(z.literal('currency')),
	mathConfig: z.string()
});

export type ReportConfigPartSchemaNumberCurrencyType = z.infer<
	typeof reportConfigPartSchema_NumberCurrency
>;

const reportConfigPartSchema_String = z.object({
	id: z.string(),
	order: z.number(),
	type: z.literal('string'),
	stringConfig: z.string()
});

export type ReportConfigPartSchemaStringType = z.infer<typeof reportConfigPartSchema_String>;

const reportConfigPartSchema_Sparkline = z.object({
	id: z.string(),
	order: z.number(),
	type: z.literal('sparkline').or(z.literal('sparklinebar')),
	mathConfig: z.string(),
	timeGrouping: z.enum(reportConfigPartTimeGroupingEnum).default('month')
});

export type ReportConfigPartSchemaSparklineType = z.infer<typeof reportConfigPartSchema_Sparkline>;

const reportConfigPartSchema_TimeGraph = z.object({
	id: z.string(),
	order: z.number(),
	type: z.literal('time_line').or(z.literal('time_stackedArea')),
	mathConfig: z.string(),
	timeGrouping: z.enum(reportConfigPartTimeGroupingEnum).default('month'),
	itemGrouping: z.enum(reportConfigPartItemGroupingEnum).optional()
});

export type ReportConfigPartSchemaTimeGraphType = z.infer<typeof reportConfigPartSchema_TimeGraph>;

const reportConfigPartSchema_NonTimeGraph = z.object({
	id: z.string(),
	order: z.number(),
	type: z.literal('pie').or(z.literal('box')).or(z.literal('bar')),
	mathConfig: z.string(),
	itemGrouping: z.enum(reportConfigPartItemGroupingEnum)
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
	itemGrouping: z.enum(reportConfigPartItemGroupingEnum).optional()
});

export type ReportConfigPartFormSchemaType = z.infer<typeof reportConfigPartFormSchema>;
export type ReportConfigPartFormSchemaSupertype = typeof reportConfigPartFormSchema;
