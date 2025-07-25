import type { DBType } from '../../db/db';
import type { 
	LLMBatchContext, 
	BatchJournalData, 
	LLMBatchProcessingConfig 
} from '../llmBatchProcessingService';

/**
 * Interface for context building modules
 */
export interface ContextBuilder {
	name: string;
	enabled: boolean;
	priority: number; // Lower numbers processed first
	
	build(params: {
		db: DBType;
		accountId: string;
		uncategorizedJournals: BatchJournalData[];
		config: LLMBatchProcessingConfig;
	}): Promise<Partial<LLMBatchContext>>;
}

/**
 * Base context builder that other builders can extend
 */
export abstract class BaseContextBuilder implements ContextBuilder {
	abstract name: string;
	abstract enabled: boolean;
	abstract priority: number;
	
	abstract build(params: {
		db: DBType;
		accountId: string;
		uncategorizedJournals: BatchJournalData[];
		config: LLMBatchProcessingConfig;
	}): Promise<Partial<LLMBatchContext>>;
	
	/**
	 * Helper method to deduplicate journals by payee/description/category
	 */
	protected deduplicateJournals(journals: BatchJournalData[]): BatchJournalData[] {
		const seen = new Set<string>();
		const deduplicated: BatchJournalData[] = [];
		
		for (const journal of journals) {
			// Create a key based on payee, description, and category
			const key = [
				journal.payee || '',
				journal.description || '',
				journal.categoryId || '',
				journal.tagId || ''
			].join('|').toLowerCase();
			
			if (!seen.has(key)) {
				seen.add(key);
				deduplicated.push(journal);
			}
		}
		
		return deduplicated;
	}
	
	/**
	 * Helper method to sort journals by date (most recent first)
	 */
	protected sortByDateDesc(journals: BatchJournalData[]): BatchJournalData[] {
		return [...journals].sort((a, b) => b.date.getTime() - a.date.getTime());
	}
	
	/**
	 * Helper method to filter journals by data checked status
	 */
	protected filterDataChecked(journals: BatchJournalData[], dataChecked = true): BatchJournalData[] {
		return journals.filter(j => j.llmReviewStatus === (dataChecked ? 'complete' : 'required'));
	}
}