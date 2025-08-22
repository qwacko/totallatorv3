// ============================================================================
// Core Types for Batch LLM Processing
// ============================================================================

/**
 * Configuration for the batch processing service
 */
export interface LLMBatchProcessingConfig {
	/** Maximum number of uncategorized journals to include in one batch */
	maxUncategorizedJournals: number;
	/** Maximum number of historical journals to include for context */
	maxHistoricalJournals: number;
	/** Maximum number of popular items (categories, tags, etc.) to include */
	maxPopularItems: number;
	/** Similarity threshold for fuzzy matching (0.0-1.0) */
	similarityThreshold: number;
	/** Whether to allow LLM to create new categories/tags/bills/budgets */
	allowAutoCreation: boolean;
	/** Minimum confidence score to include in suggestions (0.0-1.0) */
	minConfidenceThreshold: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_BATCH_CONFIG: LLMBatchProcessingConfig = {
	maxUncategorizedJournals: 10,
	maxHistoricalJournals: 100,
	maxPopularItems: 20,
	similarityThreshold: 0.3,
	allowAutoCreation: true, // Will be overridden by getServerEnv().LLM_AUTO_CREATE_ITEMS
	minConfidenceThreshold: 0.1 // Include even low-confidence suggestions for user review
};

// ============================================================================
// Journal Data Types
// ============================================================================

/**
 * Essential journal data for LLM processing
 */
export interface BatchJournalData {
	id: string;
	date: Date;
	description: string;
	amount: number;
	accountId: string;
	accountTitle: string;
	payee?: string | null;
	categoryId?: string | null;
	categoryTitle?: string | null;
	tagId?: string | null;
	tagTitle?: string | null;
	billId?: string | null;
	billTitle?: string | null;
	budgetId?: string | null;
	budgetTitle?: string | null;
	labels?: string[];
	labelTitles?: string[];
	importDetail?: any; // JSON import data
	llmReviewStatus: 'not_required' | 'required' | 'complete' | 'error';
}

/**
 * Available categorization options
 */
export interface CategorizationOptions {
	categories: Array<{ id: string; title: string; active: boolean }>;
	tags: Array<{ id: string; title: string; active: boolean }>;
	bills: Array<{ id: string; title: string; active: boolean }>;
	budgets: Array<{ id: string; title: string; active: boolean }>;
	labels: Array<{ id: string; title: string; active: boolean }>;
}

/**
 * Popular items for an account (most frequently used)
 */
export interface PopularItems {
	categories: Array<{ id: string; title: string; usageCount: number }>;
	tags: Array<{ id: string; title: string; usageCount: number }>;
	bills: Array<{ id: string; title: string; usageCount: number }>;
	budgets: Array<{ id: string; title: string; usageCount: number }>;
	labels: Array<{ id: string; title: string; usageCount: number }>;
}

// ============================================================================
// Context Building Types
// ============================================================================

/**
 * Complete context data sent to LLM for batch processing
 */
export interface LLMBatchContext {
	/** Configuration used for this batch */
	config: LLMBatchProcessingConfig;

	/** Account being processed */
	account: {
		id: string;
		title: string;
		type: string;
	};

	/** Journals that need categorization */
	uncategorizedJournals: BatchJournalData[];

	/** Historical journals for pattern recognition (deduplicated) */
	historicalJournals: BatchJournalData[];

	/** Fuzzy-matched similar journals from existing algorithm */
	fuzzyMatches: BatchJournalData[];

	/** Most popular categorization options for this account */
	popularItems: PopularItems;

	/** All available categorization options */
	allOptions: CategorizationOptions;

	/** Processing metadata */
	metadata: {
		generatedAt: Date;
		totalHistoricalJournals: number;
		deduplicationApplied: boolean;
		fuzzyMatchesFound: number;
	};
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Individual journal suggestion from LLM
 */
export interface JournalSuggestion {
	journalId: string;
	confidence: number; // 0.0-1.0

	// Suggested updates
	suggestedPayee?: string;
	suggestedDescription?: string;

	// Categorization suggestions (can be ID or name for creation)
	suggestedCategory?: string | { id: string } | { name: string };
	suggestedTag?: string | { id: string } | { name: string };
	suggestedBill?: string | { id: string } | { name: string };
	suggestedBudget?: string | { id: string } | { name: string };
	suggestedLabels?: Array<string | { id: string } | { name: string }>;

	// Analysis metadata
	reasoning: string;
	matchType: 'exact_historical' | 'fuzzy_import' | 'pattern_based' | 'educated_guess';
	confidenceFactors: string[];
	historicalMatchIds?: string[]; // IDs of historical journals used for this suggestion
}

/**
 * Items to create (when auto-creation is enabled)
 */
export interface ItemsToCreate {
	categories?: string[];
	tags?: string[];
	bills?: string[];
	budgets?: string[];
	labels?: string[];
}

/**
 * Complete LLM batch response
 */
export interface LLMBatchResponse {
	/** Processing insights and patterns found */
	batchInsights: {
		patternsFound: string[];
		historicalMatches: Array<{
			sourceJournalId: string;
			matchedJournalId: string;
			reason: string;
		}>;
		suggestedWorkflows: string[];
	};

	/** New items to create (if enabled) */
	itemsToCreate?: ItemsToCreate;

	/** Individual journal suggestions */
	journalSuggestions: JournalSuggestion[];

	/** Processing metadata */
	processingMetadata: {
		totalJournalsProcessed: number;
		highConfidenceSuggestions: number;
		mediumConfidenceSuggestions: number;
		lowConfidenceSuggestions: number;
		averageConfidence: number;
	};
}

// ============================================================================
// Service Results
// ============================================================================

/**
 * Result of processing a batch
 */
export interface BatchProcessingResult {
	success: boolean;
	accountId: string;
	journalsProcessed: number;
	suggestionsCreated: number;
	itemsCreated?: {
		categories: number;
		tags: number;
		bills: number;
		budgets: number;
		labels: number;
	};
	processingTime: number;
	error?: string;
	llmResponse?: LLMBatchResponse;
}

/**
 * Statistics for batch processing
 */
export interface BatchProcessingStats {
	totalBatchesProcessed: number;
	totalJournalsProcessed: number;
	totalSuggestionsCreated: number;
	averageConfidence: number;
	processingTime: number;
	errors: number;
}
