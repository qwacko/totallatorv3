import { z } from 'zod';
import { journalFilterSchemaWithoutPagination } from './journalSchema';

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
