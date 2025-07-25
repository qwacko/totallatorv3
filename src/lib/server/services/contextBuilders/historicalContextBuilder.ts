import { BaseContextBuilder } from './baseContextBuilder';
import type { DBType } from '../../db/db';
import type { 
	LLMBatchContext, 
	BatchJournalData, 
	LLMBatchProcessingConfig 
} from '../llmBatchProcessingService';
import { journalMaterialisedList } from '../../db/actions/helpers/journal/journalList';
import type { JournalFilterSchemaInputType } from '$lib/schema/journalSchema';

/**
 * Builds historical context by fetching recent, data-checked journals from the same account
 * Applies deduplication to remove similar transactions
 */
export class HistoricalContextBuilder extends BaseContextBuilder {
	name = 'historical';
	enabled = true;
	priority = 1;
	
	async build(params: {
		db: DBType;
		accountId: string;
		uncategorizedJournals: BatchJournalData[];
		config: LLMBatchProcessingConfig;
	}): Promise<Partial<LLMBatchContext>> {
		const { db, accountId, config } = params;
		
		// Build filter for historical journals
		const filter: JournalFilterSchemaInputType = {
			account: {
				idArray: [accountId]
			},
			dataChecked: true, // Only include reviewed/categorized journals
			llmReviewStatus: ['complete'], // Only completed LLM reviews
			page: 0,
			pageSize: Math.min(config.maxHistoricalJournals * 2, 200), // Get extra for deduplication
			orderBy: [
				{ field: 'date', direction: 'desc' } // Most recent first
			]
		};
		
		// Fetch historical journals
		const historicalResult = await journalMaterialisedList({
			db,
			filter
		});
		
		// Convert to our BatchJournalData format
		const historicalJournals: BatchJournalData[] = historicalResult.data.map(journal => ({
			id: journal.id,
			date: journal.date || new Date(),
			description: journal.description || '',
			amount: Number(journal.amount),
			accountId: journal.accountId || '',
			accountTitle: journal.accountTitle || '',
			payee: journal.payee,
			categoryId: journal.categoryId,
			categoryTitle: journal.categoryTitle,
			tagId: journal.tagId,
			tagTitle: journal.tagTitle,
			billId: journal.billId,
			billTitle: journal.billTitle,
			budgetId: journal.budgetId,
			budgetTitle: journal.budgetTitle,
			labels: journal.labels || [],
			labelTitles: journal.labelTitles || [],
			importDetail: journal.importDetail,
			llmReviewStatus: journal.llmReviewStatus as any || 'complete'
		}));
		
		// Apply deduplication
		const deduplicatedJournals = this.deduplicateJournals(historicalJournals);
		
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
}