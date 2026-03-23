import { z } from 'zod';

export const journalSuggestionResultSchema = z.object({
	journalId: z.string(),
	status: z.enum(['suggested', 'no_change', 'insufficient_context']),
	confidence: z.number().min(0).max(1),
	summary: z.string(),
	reasons: z.array(z.string()),
	proposedUpdate: z
		.object({
			description: z.string().optional(),
			accountId: z.string().optional(),
			categoryId: z.string().optional(),
			billId: z.string().optional(),
			budgetId: z.string().optional(),
			tagId: z.string().optional(),
			addLabels: z.array(z.string()).optional(),
			setDataChecked: z.boolean().optional()
		})
		.partial(),
	warnings: z.array(z.string()).default([])
});

export type JournalSuggestionResult = z.infer<typeof journalSuggestionResultSchema>;
