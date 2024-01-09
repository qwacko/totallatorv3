import { z } from 'zod';
import { journalFilterSchema } from './journalSchema';

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
	filter: journalFilterSchema.optional()
});

export type UpdateReportType = z.infer<typeof updateReportSchema>;
export type UpdateReportSupertype = typeof updateReportSchema;
