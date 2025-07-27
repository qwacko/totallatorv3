import type { DBType } from '../db/db';
import { journalMaterialisedList } from '../db/actions/helpers/journal/journalList';
import type { JournalFilterSchemaInputType } from '$lib/schema/journalSchema';
import { serverEnv } from '../serverEnv';
import { logging } from '../logging';
import { tActions } from '../db/actions/tActions';
import { LLMClient } from '../llm/client';

// Context Builders
import { HistoricalContextBuilder } from './contextBuilders/historicalContextBuilder';
import { FuzzyMatchContextBuilder } from './contextBuilders/fuzzyMatchContextBuilder';
import { PopularItemsContextBuilder } from './contextBuilders/popularItemsContextBuilder';
import type { ContextBuilder } from './contextBuilders/baseContextBuilder';

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
	allowAutoCreation: true, // Will be overridden by serverEnv.LLM_AUTO_CREATE_ITEMS
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
		historicalMatches: Array<{ sourceJournalId: string; matchedJournalId: string; reason: string }>;
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

// ============================================================================
// Main Service Implementation
// ============================================================================

/**
 * Main LLM Batch Processing Service
 * Orchestrates the entire batch processing workflow
 */
export class LLMBatchProcessingService {
	private db: DBType;
	private contextBuilders: ContextBuilder[];
	
	constructor(db: DBType) {
		this.db = db;
		
		// Initialize context builders in priority orde
		this.contextBuilders = [
			new HistoricalContextBuilder(),
			new FuzzyMatchContextBuilder(),
			new PopularItemsContextBuilder()
		].sort((a, b) => a.priority - b.priority);
	}
	
	/**
	 * Process all accounts that have journals requiring LLM review
	 */
	async processAllAccounts(config: Partial<LLMBatchProcessingConfig> = {}): Promise<BatchProcessingStats> {
		const finalConfig = { 
			...DEFAULT_BATCH_CONFIG, 
			...config,
			allowAutoCreation: serverEnv.LLM_AUTO_CREATE_ITEMS // Override with env setting
		};
		const startTime = Date.now();
		
		// Check if LLM processing is enabled
		if (!serverEnv.LLM_REVIEW_ENABLED) {
			logging.info('LLM Batch Processing: Skipped - LLM_REVIEW_ENABLED is false');
			return this.emptyStats(Date.now() - startTime);
		}
		
		// Get enabled LLM providers
		const allProviders = await tActions.llm.list({ db: this.db });
		const enabledProviders = allProviders.filter(p => p.enabled);
		logging.info(`LLM Batch Processing: Found ${allProviders.length} total providers, ${enabledProviders.length} enabled`);
		if (enabledProviders.length === 0) {
			logging.info('LLM Batch Processing: Skipped - No enabled providers');
			return this.emptyStats(Date.now() - startTime);
		}
		
		// Get accounts that have journals requiring processing
		const accountsWithWork = await this.getAccountsWithRequiredJournals();
		
		logging.info(`LLM Batch Processing: Found ${accountsWithWork.length} accounts with journals requiring processing`);
		if (accountsWithWork.length === 0) {
			logging.info('LLM Batch Processing: No accounts with journals requiring processing');
			return this.emptyStats(Date.now() - startTime);
		}
		
		logging.info(`LLM Batch Processing: Processing ${accountsWithWork.length} accounts`);
		
		const stats: BatchProcessingStats = {
			totalBatchesProcessed: 0,
			totalJournalsProcessed: 0,
			totalSuggestionsCreated: 0,
			averageConfidence: 0,
			processingTime: 0,
			errors: 0
		};
		
		// Process each account
		for (const account of accountsWithWork) {
			try {
				const result = await this.processAccount(account.id, finalConfig);
				
				stats.totalBatchesProcessed++;
				stats.totalJournalsProcessed += result.journalsProcessed;
				stats.totalSuggestionsCreated += result.suggestionsCreated;
				
				if (result.llmResponse) {
					const confidence = result.llmResponse.processingMetadata.averageConfidence;
					stats.averageConfidence = (stats.averageConfidence + confidence) / 2;
				}
				
				logging.info(`LLM Batch Processing: Account ${account.title} - ${result.journalsProcessed} journals processed`);
				
			} catch (error) {
				stats.errors++;
				logging.error(`LLM Batch Processing: Error processing account ${account.id}:`, error);
			}
		}
		
		stats.processingTime = Date.now() - startTime;
		logging.info(`LLM Batch Processing: Completed - ${stats.totalBatchesProcessed} batches, ${stats.totalJournalsProcessed} journals`);
		
		return stats;
	}
	
	/**
	 * Process a specific account
	 */
	async processAccount(accountId: string, config: LLMBatchProcessingConfig): Promise<BatchProcessingResult> {
		const startTime = Date.now();
		
		try {
			// Get uncategorized journals for this account
			const uncategorizedJournals = await this.getUncategorizedJournals(accountId, config);
			
			if (uncategorizedJournals.length === 0) {
				return {
					success: true,
					accountId,
					journalsProcessed: 0,
					suggestionsCreated: 0,
					processingTime: Date.now() - startTime
				};
			}
			
			// Build context using all enabled builders
			const context = await this.buildContext(accountId, uncategorizedJournals, config);
			
			// Call LLM for batch processing
			const llmResponse = await this.callLLMForBatch(context);
			
			// Process the LLM response (create items if enabled, store suggestions)
			const processResult = await this.processLLMResponse(llmResponse, config);
			
			// For now, just log the response - we'll implement suggestion storage later
			logging.info(`LLM Batch Processing Result for account ${accountId}:`, {
				journalsProcessed: uncategorizedJournals.length,
				suggestionsCount: llmResponse.journalSuggestions.length,
				averageConfidence: llmResponse.processingMetadata.averageConfidence,
				patternsFound: llmResponse.batchInsights.patternsFound.length
			});
			
			return {
				success: true,
				accountId,
				journalsProcessed: uncategorizedJournals.length,
				suggestionsCreated: llmResponse.journalSuggestions.length,
				itemsCreated: processResult.itemsCreated,
				processingTime: Date.now() - startTime,
				llmResponse
			};
			
		} catch (error) {
			logging.error(`LLM Batch Processing: Error processing account ${accountId}:`, error);
			return {
				success: false,
				accountId,
				journalsProcessed: 0,
				suggestionsCreated: 0,
				processingTime: Date.now() - startTime,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}
	
	/**
	 * Get accounts that have journals requiring processing
	 * Only processes asset and liability accounts since expense/income accounts 
	 * are already categorized in a double-entry system
	 */
	private async getAccountsWithRequiredJournals(): Promise<Array<{ id: string; title: string }>> {
		// Filter for journals in asset/liability accounts that need processing
		const filter: JournalFilterSchemaInputType = {
			llmReviewStatus: ['required'],
			account: {
				type: ['asset', 'liability'] // Only process these account types
			},
			page: 0,
			pageSize: 100,
			orderBy: [{ field: 'date', direction: 'desc' }]
		};
		
		const result = await journalMaterialisedList({ db: this.db, filter });
		
		logging.info(`LLM Batch Processing: Found ${result.count} journals with status 'required' in asset/liability accounts (showing ${result.data.length})`);
		
		// Extract unique account IDs
		const accountIds = new Set(result.data.map(j => j.accountId).filter(Boolean));
		
		logging.info(`LLM Batch Processing: Journals span ${accountIds.size} asset/liability accounts: ${Array.from(accountIds).join(', ')}`);
		
		// Get account details and verify they are asset/liability accounts
		const accounts = await Promise.all(
			Array.from(accountIds).map(async (id) => {
				const account = await tActions.account.getById(this.db, id!);
				if (account && (account.type === 'asset' || account.type === 'liability')) {
					return { id: account.id, title: account.title, type: account.type };
				}
				return null;
			})
		);
		
		const validAccounts = accounts.filter(Boolean) as Array<{ id: string; title: string; type: string }>;
		logging.info(`LLM Batch Processing: Processing ${validAccounts.length} asset/liability accounts: ${validAccounts.map(a => `${a.title} (${a.type})`).join(', ')}`);
		
		return validAccounts;
	}
	
	/**
	 * Get uncategorized journals for an account (asset/liability accounts only)
	 */
	private async getUncategorizedJournals(
		accountId: string, 
		config: LLMBatchProcessingConfig
	): Promise<BatchJournalData[]> {
		const filter: JournalFilterSchemaInputType = {
			account: {
				idArray: [accountId],
				type: ['asset', 'liability'] // Double-check account type
			},
			page: 0,
			pageSize: config.maxUncategorizedJournals,
			orderBy: [
				{ field: 'date', direction: 'desc' } // Most recent first
			]
		};
		
		const result = await journalMaterialisedList({ db: this.db, filter });
		
		return result.data.map(journal => ({
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
			llmReviewStatus: journal.llmReviewStatus as any || 'required'
		}));
	}
	
	/**
	 * Build complete context using all enabled context builders
	 */
	private async buildContext(
		accountId: string, 
		uncategorizedJournals: BatchJournalData[], 
		config: LLMBatchProcessingConfig
	): Promise<LLMBatchContext> {
		let context: Partial<LLMBatchContext> = {
			config,
			uncategorizedJournals
		};
		
		// Run each enabled context builder
		for (const builder of this.contextBuilders) {
			if (!builder.enabled) continue;
			
			try {
				logging.debug(`LLM Batch Processing: Running context builder '${builder.name}'`);
				const builderContext = await builder.build({
					db: this.db,
					accountId,
					uncategorizedJournals,
					config
				});
				
				// Merge builder results into main context
				context = { ...context, ...builderContext };
				
			} catch (error) {
				logging.error(`LLM Batch Processing: Context builder '${builder.name}' failed:`, error);
				// Continue with other builders
			}
		}
		
		// Ensure required fields are present
		if (!context.account) {
			throw new Error('Account context not built');
		}
		if (!context.historicalJournals) {
			context.historicalJournals = [];
		}
		if (!context.fuzzyMatches) {
			context.fuzzyMatches = [];
		}
		if (!context.popularItems) {
			throw new Error('Popular items context not built');
		}
		if (!context.allOptions) {
			throw new Error('All options context not built');
		}
		if (!context.metadata) {
			context.metadata = {
				generatedAt: new Date(),
				totalHistoricalJournals: 0,
				deduplicationApplied: false,
				fuzzyMatchesFound: 0
			};
		}
		
		return context as LLMBatchContext;
	}
	
	/**
	 * Call LLM with batch context
	 */
	private async callLLMForBatch(context: LLMBatchContext): Promise<LLMBatchResponse> {
		// Get first enabled LLM provider
		const allProviders = await tActions.llm.list({ db: this.db });
		const providers = allProviders.filter(p => p.enabled);
		if (providers.length === 0) {
			throw new Error('No enabled LLM providers found');
		}
		
		const provider = providers[0];
		const llmSettings = await tActions.llm.getById({ 
			db: this.db, 
			id: provider.id, 
			includeApiKey: true 
		});
		
		if (!llmSettings || !llmSettings.defaultModel) {
			throw new Error(`LLM provider ${provider.id} not configured properly`);
		}
		
		// Create LLM client
		const llmClient = new LLMClient(llmSettings, this.db);
		console.log("LLM Client", !!llmClient)
		
		// Build comprehensive prompt
		const prompt = this.buildBatchPrompt(context);
		
		// For now, we'll just log the context and return a mock response
		// In the next iteration, we'll implement the actual LLM call
		logging.info('LLM Batch Context built:', {
			accountId: context.account.id,
			uncategorizedCount: context.uncategorizedJournals.length,
			historicalCount: context.historicalJournals.length,
			fuzzyMatchCount: context.fuzzyMatches.length,
			popularCategoriesCount: context.popularItems.categories.length
		});

		logging.info('LLM Prompt:', prompt)
		
		// Mock response for now
		const mockResponse: LLMBatchResponse = {
			batchInsights: {
				patternsFound: ['Recurring grocery transactions', 'Monthly utility payments'],
				historicalMatches: [],
				suggestedWorkflows: ['Auto-categorize similar transactions']
			},
			journalSuggestions: context.uncategorizedJournals.map(journal => ({
				journalId: journal.id,
				confidence: 0.8,
				suggestedPayee: journal.description.split(' ')[0],
				reasoning: 'Mock suggestion for testing',
				matchType: 'pattern_based',
				confidenceFactors: ['Similar transaction found in history']
			})),
			processingMetadata: {
				totalJournalsProcessed: context.uncategorizedJournals.length,
				highConfidenceSuggestions: 0,
				mediumConfidenceSuggestions: context.uncategorizedJournals.length,
				lowConfidenceSuggestions: 0,
				averageConfidence: 0.8
			}
		};
		
		return mockResponse;
	}
	
	/**
	 * Build comprehensive prompt for batch processing
	 */
	private buildBatchPrompt(context: LLMBatchContext): string {
		// This will be implemented in the next iteration
		return `Batch processing prompt for ${context.uncategorizedJournals.length} journals`;
	}
	
	/**
	 * Process LLM response (create items, store suggestions)
	 */
	private async processLLMResponse(
		response: LLMBatchResponse, 
		config: LLMBatchProcessingConfig
	): Promise<{ itemsCreated?: { categories: number; tags: number; bills: number; budgets: number; labels: number } }> {
		// This will be implemented in the next iteration
		return {};
	}
	
	/**
	 * Create empty stats object
	 */
	private emptyStats(processingTime: number): BatchProcessingStats {
		return {
			totalBatchesProcessed: 0,
			totalJournalsProcessed: 0,
			totalSuggestionsCreated: 0,
			averageConfidence: 0,
			processingTime,
			errors: 0
		};
	}
}