import { z } from 'zod';

export const contextJournalSchema = z.object({
	id: z.string(),
	transactionId: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	dateText: z.string().nullable().optional(),
	amount: z.number().nullable().optional(),
	accountId: z.string().nullable().optional(),
	importId: z.string().nullable().optional(),
	importDetailId: z.string().nullable().optional(),
	importUniqueId: z.string().nullable().optional(),
	flags: z
		.object({
			dataChecked: z.boolean().optional(),
			complete: z.boolean().optional(),
			linked: z.boolean().optional(),
			reconciled: z.boolean().optional(),
			transfer: z.boolean().optional()
		})
		.partial()
		.default({}),
	transactionContext: z
		.array(
			z.object({
				journalId: z.string(),
				accountId: z.string().nullable().optional(),
				description: z.string().nullable().optional(),
				amount: z.number().nullable().optional()
			})
		)
		.default([])
});

export const historicalMatchSchema = z.object({
	targetJournalId: z.string(),
	matchType: z.enum(['import_similarity', 'description_similarity', 'amount_similarity']),
	matchKey: z.string().optional(),
	confidenceHint: z.number().min(0).max(1).optional(),
	journalId: z.string().optional(),
	accountId: z.string().optional(),
	categoryId: z.string().optional(),
	tagId: z.string().optional(),
	billId: z.string().optional(),
	budgetId: z.string().optional(),
	description: z.string().optional(),
	amount: z.number().optional(),
	reason: z.string()
});

export const frequentPatternSchema = z.object({
	targetJournalId: z.string(),
	accountId: z.string().optional(),
	patternType: z.enum(['category', 'tag', 'bill', 'budget', 'account_combination']),
	entityId: z.string().optional(),
	label: z.string(),
	occurrenceCount: z.number().int().nonnegative().default(0),
	shareOfAccountActivity: z.number().min(0).max(1).optional(),
	reason: z.string()
});

export const entitySearchTypeSchema = z.enum([
	'account',
	'category',
	'tag',
	'label',
	'bill',
	'budget'
]);

export const entitySearchCandidateSchema = z.object({
	entityType: entitySearchTypeSchema,
	id: z.string(),
	title: z.string(),
	similarityScore: z.number().min(0).max(1),
	reason: z.string()
});
