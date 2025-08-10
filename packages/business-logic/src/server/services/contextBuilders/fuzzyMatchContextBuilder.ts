import { deduplicateJournals, type ContextBuilderParams } from './baseContextBuilder';
import type { LLMBatchContext, BatchJournalData } from '../llmBatchProcessingService';
import { journalMaterializedViewActions } from '../../../actions/journalMaterializedViewActions';

/**
 * Builds fuzzy match context using the existing similarity algorithm
 * Leverages import data matching for better transaction recognition
 */
export async function buildFuzzyMatchContext(
	params: ContextBuilderParams
): Promise<Partial<LLMBatchContext>> {
	const { uncategorizedJournals, config } = params;

	const allFuzzyMatches: BatchJournalData[] = [];

	// Process each uncategorized journal to find fuzzy matches
	for (const journal of uncategorizedJournals) {
		try {
			console.log(
				`Fuzzy Match: Processing journal ${journal.id}, has importDetail: ${!!journal.importDetail}`
			);

			// Use existing recommendation system for import-based similarity
			const recommendations = await journalMaterializedViewActions.listRecommendations({
				journals: [
					{
						id: journal.id,
						description: journal.description,
						dataChecked: false, // We want recommendations for unchecked items
						accountId: journal.accountId,
						importDetail: journal.importDetail
					}
				],
				similarityThreshold: config.similarityThreshold
			});

			console.log(
				`Fuzzy Match: Found ${recommendations?.length || 0} recommendations for journal ${journal.id}`
			);

			if (recommendations && recommendations.length > 0) {
				// Convert recommendations to BatchJournalData format
				const matches: BatchJournalData[] = recommendations.map((rec) => ({
					id: rec.journalId,
					date: rec.journalDate,
					description: rec.journalDescription || '',
					amount: Number(rec.journalAmount),
					accountId: rec.journalAccountId || '',
					accountTitle: '', // Will be populated if needed
					payee: rec.checkDescription || undefined,
					categoryId: rec.journalCategoryId,
					categoryTitle: undefined, // Could be expanded if needed
					tagId: rec.journalTagId,
					tagTitle: undefined,
					billId: rec.journalBillId,
					billTitle: undefined,
					budgetId: rec.journalBudgetId,
					budgetTitle: undefined,
					labels: [],
					labelTitles: [],
					importDetail: undefined,
					llmReviewStatus: rec.journalDataChecked ? 'complete' : 'required'
				}));

				allFuzzyMatches.push(...matches);
			}
		} catch (error) {
			console.warn(`Failed to get fuzzy matches for journal ${journal.id}:`, error);
			// Continue processing other journals
		}
	}

	// Remove duplicates and limit results
	const deduplicatedMatches = deduplicateJournals(allFuzzyMatches);
	const limitedMatches = deduplicatedMatches.slice(0, 50); // Reasonable limit for context

	return {
		fuzzyMatches: limitedMatches,
		metadata: {
			generatedAt: new Date(),
			totalHistoricalJournals: 0,
			deduplicationApplied: false,
			fuzzyMatchesFound: limitedMatches.length
		}
	};
}
