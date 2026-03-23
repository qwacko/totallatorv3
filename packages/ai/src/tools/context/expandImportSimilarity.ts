import { tool } from 'ai';
import { z } from 'zod';

import type { DBType } from '@totallator/database';

import { historicalMatchSchema } from '../types';

const inputSchema = z.object({
	journalIds: z.array(z.string()).min(1),
	limitPerJournal: z.number().int().positive().max(25).default(8),
	includeImportSourcePatterns: z.boolean().default(true)
});

export const expandImportSimilarityInputSchema = inputSchema;

export const expandImportSimilarityOutputSchema = z.object({
	matches: z.array(historicalMatchSchema),
	notes: z.array(z.string()).default([])
});

export type ExpandImportSimilarityResult = z.infer<typeof expandImportSimilarityOutputSchema>;

/**
 * Stub implementation for deeper import-based similarity evidence.
 *
 * Intended future behavior:
 * - Search prior import rows with fuzzy matching / similarity scoring.
 * - Prefer journals that are complete or data_checked.
 * - Return ranked evidence records rather than raw table rows.
 */
export const expandImportSimilarityData = async ({
	db: _db,
	journalIds,
	limitPerJournal,
	includeImportSourcePatterns
}: {
	db: DBType;
	journalIds: string[];
	limitPerJournal: number;
	includeImportSourcePatterns: boolean;
}): Promise<ExpandImportSimilarityResult> => {
	return {
		matches: journalIds.map((journalId) => ({
			targetJournalId: journalId,
			matchType: 'import_similarity' as const,
			confidenceHint: 0.25,
			reason:
				'Stub import similarity evidence. Business-logic support for fuzzy import matching is not implemented yet.'
		})),
		notes: [
			`Stub import similarity expansion requested for ${journalIds.length} journal(s).`,
			`Future implementation should return up to ${limitPerJournal} ranked import matches per journal.`,
			includeImportSourcePatterns
				? 'Import source pattern expansion is enabled for future implementation.'
				: 'Import source pattern expansion is disabled for this call.'
		]
	};
};

export const buildExpandImportSimilarityTool = (db: DBType) =>
	tool({
		description:
			'Expand import-driven historical evidence using fuzzy matching and prior data-checked journals.',
		inputSchema,
		outputSchema: expandImportSimilarityOutputSchema,
		execute: async ({ journalIds, limitPerJournal, includeImportSourcePatterns }) =>
			await expandImportSimilarityData({
				db,
				journalIds,
				limitPerJournal,
				includeImportSourcePatterns
			})
	});
