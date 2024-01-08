import { z } from 'zod';
import { journalFilterSchema } from './journalSchema';

export const createReportSchema = z.object({
	title: z.string(),
	group: z.string().optional(),
	locked: z.boolean().optional().default(false)
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
