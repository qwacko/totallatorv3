import { tool } from 'ai';
import { z } from 'zod';

import type { DBType } from '@totallator/database';

import {
	expandImportSimilarityData,
	expandImportSimilarityOutputSchema
} from './expandImportSimilarity';
import {
	expandJournalSimilarityData,
	expandJournalSimilarityOutputSchema
} from './expandJournalSimilarity';
import { getJournalsContextData, getJournalsContextOutputSchema } from './getJournalsContext';

const inputSchema = z.object({
	journalIds: z.array(z.string()).min(1),
	evidenceLimitPerJournal: z.number().int().positive().max(25).default(6)
});

export const buildInitialContextInputSchema = inputSchema;

export const buildInitialContextOutputSchema = z.object({
	journalContext: getJournalsContextOutputSchema,
	importSimilarity: expandImportSimilarityOutputSchema,
	journalSimilarity: expandJournalSimilarityOutputSchema,
	candidateSummaries: z
		.array(
			z.object({
				targetJournalId: z.string(),
				summary: z.string()
			})
		)
		.default([]),
	notes: z.array(z.string()).default([])
});

export type BuildInitialContextResult = z.infer<typeof buildInitialContextOutputSchema>;

/**
 * Substantial preload step for the journal recommendation agent.
 *
 * This is intentionally not a thin wrapper around a single journal lookup.
 * The goal is to front-load the most likely useful evidence so the model
 * does not need to spend its first steps rediscovering core context.
 *
 * The current implementation is a stub composition layer over the other tool
 * data functions. The next step is to replace these internals with richer
 * business-logic-backed retrieval.
 */
export const buildInitialContextData = async ({
	db,
	journalIds,
	evidenceLimitPerJournal
}: {
	db: DBType;
	journalIds: string[];
	evidenceLimitPerJournal: number;
}): Promise<BuildInitialContextResult> => {
	const journalContext = await getJournalsContextData({
		db,
		journalIds,
		includeTransactionContext: true
	});
	const importSimilarity = await expandImportSimilarityData({
		db,
		journalIds,
		limitPerJournal: evidenceLimitPerJournal,
		includeImportSourcePatterns: true
	});
	const journalSimilarity = await expandJournalSimilarityData({
		db,
		journalIds,
		limitPerJournal: evidenceLimitPerJournal,
		includeDescriptionSimilarity: true,
		includeAmountSimilarity: true,
		includeFrequentPatterns: true
	});

	return {
		journalContext,
		importSimilarity,
		journalSimilarity,
		candidateSummaries: journalIds.map((journalId) => ({
			targetJournalId: journalId,
			summary:
				'Stub initial context summary. Future implementation should synthesize top import, description, amount, and frequency evidence into a compact starting bundle.'
		})),
		notes: [
			'Initial context is intentionally substantial rather than minimal.',
			'The preload currently composes stub tool data functions and will later be backed by business-logic retrieval.',
			'Import-driven similarity should remain the highest-priority evidence source in the eventual implementation.'
		]
	};
};

export const buildBuildInitialContextTool = (db: DBType) =>
	tool({
		description:
			'Build substantial initial context for the target journals by combining core journal, import, and historical evidence.',
		inputSchema,
		outputSchema: buildInitialContextOutputSchema,
		execute: async ({ journalIds, evidenceLimitPerJournal }) =>
			await buildInitialContextData({
				db,
				journalIds,
				evidenceLimitPerJournal
			})
	});
