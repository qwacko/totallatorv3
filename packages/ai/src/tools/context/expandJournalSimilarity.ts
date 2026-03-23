import { tool } from 'ai';
import { z } from 'zod';

import type { DBType } from '@totallator/database';

import { frequentPatternSchema, historicalMatchSchema } from '../types';

const inputSchema = z.object({
	journalIds: z.array(z.string()).min(1),
	limitPerJournal: z.number().int().positive().max(25).default(8),
	includeDescriptionSimilarity: z.boolean().default(true),
	includeAmountSimilarity: z.boolean().default(true),
	includeFrequentPatterns: z.boolean().default(true)
});

export const expandJournalSimilarityInputSchema = inputSchema;

export const expandJournalSimilarityOutputSchema = z.object({
	descriptionMatches: z.array(historicalMatchSchema),
	amountMatches: z.array(historicalMatchSchema),
	frequentPatterns: z.array(frequentPatternSchema),
	notes: z.array(z.string()).default([])
});

export type ExpandJournalSimilarityResult = z.infer<typeof expandJournalSimilarityOutputSchema>;

/**
 * Stub implementation for journal-history evidence expansion.
 *
 * Intended future behavior:
 * - Description similarity should use fuzzy matching against complete / data_checked history.
 * - Amount similarity should find same-account journals near the target amount and group them by repeated classifications.
 * - Frequent patterns should summarize the most common account-specific combinations.
 */
export const expandJournalSimilarityData = async ({
	db: _db,
	journalIds,
	limitPerJournal,
	includeDescriptionSimilarity,
	includeAmountSimilarity,
	includeFrequentPatterns
}: {
	db: DBType;
	journalIds: string[];
	limitPerJournal: number;
	includeDescriptionSimilarity: boolean;
	includeAmountSimilarity: boolean;
	includeFrequentPatterns: boolean;
}): Promise<ExpandJournalSimilarityResult> => {
	return {
		descriptionMatches: includeDescriptionSimilarity
			? journalIds.map((journalId) => ({
					targetJournalId: journalId,
					matchType: 'description_similarity' as const,
					confidenceHint: 0.2,
					reason:
						'Stub description similarity evidence. Fuzzy description matching is not implemented yet.'
				}))
			: [],
		amountMatches: includeAmountSimilarity
			? journalIds.map((journalId) => ({
					targetJournalId: journalId,
					matchType: 'amount_similarity' as const,
					confidenceHint: 0.2,
					reason:
						'Stub amount similarity evidence. Similar-amount grouping is not implemented yet.'
				}))
			: [],
		frequentPatterns: includeFrequentPatterns
			? journalIds.map((journalId) => ({
					targetJournalId: journalId,
					patternType: 'account_combination' as const,
					label: 'Stub frequent pattern',
					occurrenceCount: 0,
					reason:
						'Stub account frequency evidence. Most-frequent account combinations are not implemented yet.'
				}))
			: [],
		notes: [
			`Stub journal similarity expansion requested for ${journalIds.length} journal(s).`,
			`Future implementation should return up to ${limitPerJournal} ranked evidence rows per journal.`
		]
	};
};

export const buildExpandJournalSimilarityTool = (db: DBType) =>
	tool({
		description:
			'Expand description, amount, and frequency-based historical evidence for the target journals.',
		inputSchema,
		outputSchema: expandJournalSimilarityOutputSchema,
		execute: async ({
			journalIds,
			limitPerJournal,
			includeDescriptionSimilarity,
			includeAmountSimilarity,
			includeFrequentPatterns
		}) =>
			await expandJournalSimilarityData({
				db,
				journalIds,
				limitPerJournal,
				includeDescriptionSimilarity,
				includeAmountSimilarity,
				includeFrequentPatterns
			})
	});
