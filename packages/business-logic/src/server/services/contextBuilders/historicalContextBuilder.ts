import type { JournalFilterSchemaInputType } from '@totallator/shared';

import { journalMaterialisedList } from '@/actions/helpers/journal/journalList';

import type { BatchJournalData, LLMBatchContext } from '../llmBatchProcessingServiceTypes';
import { type ContextBuilderParams, deduplicateJournals } from './baseContextBuilder';

/**
 * Builds historical context by fetching recent, data-checked journals from the same account
 * Applies deduplication to remove similar transactions
 */
export async function buildHistoricalContext(
	params: ContextBuilderParams
): Promise<Partial<LLMBatchContext>> {
	const { db, accountId, config } = params;

	// Build filter for historical journals from same asset/liability account
	const filter: JournalFilterSchemaInputType = {
		account: {
			idArray: [accountId],
			type: ['asset', 'liability'] // Only process these account types
		},
		// Remove dataChecked filter - journals with categorization (even if not manually reviewed)
		// can provide valuable context patterns
		// Remove llmReviewStatus filter - journals with 'not_required' or null status
		// can still provide valuable categorization patterns

		// Exclude journals that are currently being processed
		llmReviewStatus: ['not_required', 'complete'], // Exclude 'required' (being processed) and 'error'
		page: 0,
		pageSize: Math.min(config.maxHistoricalJournals * 10, 200), // Get extra for deduplication
		orderBy: [
			{ field: 'date', direction: 'desc' } // Most recent first
		]
	};

	// Fetch historical journals
	const historicalResult = await journalMaterialisedList({
		db,
		filter
	});

	console.log(
		`Historical Context: Found ${historicalResult.count} total, showing ${historicalResult.data.length} journals for account ${accountId}`
	);

	// Convert to our BatchJournalData format
	const historicalJournals: BatchJournalData[] = historicalResult.data.map((journal) => ({
		id: journal.id,
		date: journal.date || new Date(),
		description: journal.description || '',
		amount: Number(journal.amount),
		accountId: journal.accountId || '',
		accountTitle: journal.accountTitle || '',
		payee: journal.description || '', // Use description as payee fallback
		categoryId: journal.categoryId,
		categoryTitle: journal.categoryTitle,
		tagId: journal.tagId,
		tagTitle: journal.tagTitle,
		billId: journal.billId,
		billTitle: journal.billTitle,
		budgetId: journal.budgetId,
		budgetTitle: journal.budgetTitle,
		labels: journal.labels ? journal.labels.map((l: any) => l.id || l) : [],
		labelTitles: journal.labels ? journal.labels.map((l: any) => l.title || l) : [],
		importDetail: journal.importDetail,
		llmReviewStatus: (journal.llmReviewStatus as any) || 'not_required'
	}));

	// Apply deduplication
	const deduplicatedJournals = deduplicateJournals(historicalJournals);

	// Limit to configured maximum
	const limitedJournals = deduplicatedJournals.slice(0, config.maxHistoricalJournals);

	return {
		historicalJournals: limitedJournals,
		metadata: {
			generatedAt: new Date(),
			totalHistoricalJournals: historicalResult.count,
			deduplicationApplied: deduplicatedJournals.length < historicalJournals.length,
			fuzzyMatchesFound: 0 // Will be set by fuzzy matcher
		}
	};
}
