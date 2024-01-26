import { z } from 'zod';
import { journalFilterSchemaWithoutPagination } from './journalSchema';
import type { SelectOptionType } from 'flowbite-svelte';

export const reportLayoutOptionsEnum = ['default', 'sixEven', 'wideOnly'] as const;

export type ReportLayoutIds = (typeof reportLayoutOptionsEnum)[number];

export const createReportSchema = z.object({
	title: z.string(),
	group: z.string().optional(),
	locked: z.boolean().optional().default(false),
	layout: z.enum(reportLayoutOptionsEnum).optional().default('default')
});

export type CreateReportType = z.infer<typeof createReportSchema>;
export type CreateReportSupertype = typeof createReportSchema;

export const updateReportSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	group: z.string().optional(),
	locked: z.string().optional(),
	filter: journalFilterSchemaWithoutPagination.optional()
});

export type UpdateReportType = z.infer<typeof updateReportSchema>;
export type UpdateReportSupertype = typeof updateReportSchema;

export const createReportElementSchema = z.object({
	reportId: z.string(),
	cols: z.number(),
	rows: z.number(),
	order: z.number(),
	title: z.string().optional().nullable()
});

export type CreateReportElementType = z.infer<typeof createReportElementSchema>;

export const updateReportLayoutSchema = z.object({
	id: z.string(),
	reportElements: z.array(
		z.object({
			id: z.string(),
			cols: z.number(),
			rows: z.number(),
			order: z.number(),
			title: z.string().optional().nullable()
		})
	)
});

export type UpdateReportLayoutType = z.infer<typeof updateReportLayoutSchema>;
export type UpdateReportLayoutSupertype = typeof updateReportLayoutSchema;

export const updateReportElementSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	clearTitle: z.boolean().optional()
});

export type UpdateReportElementType = z.infer<typeof updateReportElementSchema>;
export type UpdateReportElementSupertype = typeof updateReportElementSchema;

export const graphGroupingEnum = [
	'account',
	'account_type',
	'tag',
	'category',
	'bill',
	'budget'
] as const;

export const reportElementConfigNumber = z.object({
	type: z.literal('number'),
	precision: z.number().optional().default(0),
	percentage: z.boolean().optional().default(false)
});

export type ReportElementConfigNumberType = z.infer<typeof reportElementConfigNumber>;

export const reportElementConfigGraphTypeEnum = ['bar', 'pie', 'absoluteArea'] as const;
export const configTypeDropdownOptions: SelectOptionType<string>[] = [
	{ name: 'Number', value: 'number' },
	{ name: 'Graph', value: 'graph' }
] as const;

export const reportElementConfigGraph = z.object({
	type: z.literal('graph'),
	graphType: z.enum(reportElementConfigGraphTypeEnum),
	grouping: z.enum(graphGroupingEnum)
});

export const reportElementConfigurationSchema = z
	.union([reportElementConfigNumber, reportElementConfigGraph])
	.optional();
export type ReportElementConfigType = z.infer<typeof reportElementConfigurationSchema>;

export const reportElementConfigurationFormSchema = z.object({
	type: z.enum(['number', 'graph']),
	precision: z.number().optional().default(2),
	percentage: z.boolean().optional().default(false),
	graphType: z.enum(reportElementConfigGraphTypeEnum).optional().default('bar'),
	grouping: z.enum(graphGroupingEnum).optional().default('account')
});

export type ReportElementConfigFormType = z.infer<typeof reportElementConfigurationFormSchema>;
export type ReportElementConfigFormSupertype = typeof reportElementConfigurationFormSchema;
