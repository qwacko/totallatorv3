import { z } from 'zod';

export const journalRecommendationSchema = z.union([
	z.object({
		type: z.literal('description'),
		description: z.string().optional()
	}),
	z.object({
		type: z.literal('account'),
		accountId: z.string().optional()
	})
]);

export type JournalRecommendationSchemaType = z.infer<typeof journalRecommendationSchema>;
