import type { DBType } from '@totallator/database';
import type { BatchJournalData, LLMBatchProcessingConfig } from '../llmBatchProcessingService';

/**
 * Interface for context building functions
 */
export interface ContextBuilderParams {
	db: DBType;
	accountId: string;
	uncategorizedJournals: BatchJournalData[];
	config: LLMBatchProcessingConfig;
}

/**
 * Helper function to deduplicate journals by payee/description/category
 */
export function deduplicateJournals(journals: BatchJournalData[]): BatchJournalData[] {
	const seen = new Set<string>();
	const deduplicated: BatchJournalData[] = [];

	for (const journal of journals) {
		// Create a key based on payee, description, and category
		const key = [
			journal.payee || '',
			journal.description || '',
			journal.categoryId || '',
			journal.tagId || ''
		]
			.join('|')
			.toLowerCase();

		if (!seen.has(key)) {
			seen.add(key);
			deduplicated.push(journal);
		}
	}

	return deduplicated;
}

/**
 * Helper function to sort journals by date (most recent first)
 */
export function sortByDateDesc(journals: BatchJournalData[]): BatchJournalData[] {
	return [...journals].sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Helper function to filter journals by data checked status
 */
export function filterDataChecked(
	journals: BatchJournalData[],
	dataChecked = true
): BatchJournalData[] {
	return journals.filter((j) => j.llmReviewStatus === (dataChecked ? 'complete' : 'required'));
}
