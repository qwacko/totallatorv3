import type { DBType } from '@totallator/database';
import { journalMaterialisedList } from '@/actions/helpers/journal/journalList';
import type { JournalFilterSchemaInputType } from '@totallator/shared';
import { getServerEnv } from '@/serverEnv';
import { getLogger } from '@/logger';
import { createLLMClient } from '../llm/modernClient';

// Context Builders
import { buildHistoricalContext } from './contextBuilders/historicalContextBuilder';
import { buildFuzzyMatchContext } from './contextBuilders/fuzzyMatchContextBuilder';
import { buildPopularItemsContext } from './contextBuilders/popularItemsContextBuilder';
import { llmActions } from '@/actions/llmActions';
import { accountActions } from '@/actions/accountActions';

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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create empty stats object
 */
function emptyStats(processingTime: number): BatchProcessingStats {
	return {
		totalBatchesProcessed: 0,
		totalJournalsProcessed: 0,
		totalSuggestionsCreated: 0,
		averageConfidence: 0,
		processingTime,
		errors: 0
	};
}

/**
 * Process all accounts that have journals requiring LLM review
 */
export async function processAllAccounts(
	db: DBType,
	config: Partial<LLMBatchProcessingConfig> = {}
): Promise<BatchProcessingStats> {
	const finalConfig = {
		...DEFAULT_BATCH_CONFIG,
		...config,
		allowAutoCreation: getServerEnv().LLM_AUTO_CREATE_ITEMS // Override with env setting
	};
	const startTime = Date.now();

	// Check if LLM processing is enabled
	if (!getServerEnv().LLM_REVIEW_ENABLED) {
		getLogger().info('LLM Batch Processing: Skipped - LLM_REVIEW_ENABLED is false');
		return emptyStats(Date.now() - startTime);
	}

	// Get enabled LLM providers
	const allProviders = await llmActions.list({ db });
	const enabledProviders = allProviders.filter((p) => p.enabled);
	getLogger().info(
		`LLM Batch Processing: Found ${allProviders.length} total providers, ${enabledProviders.length} enabled`
	);
	if (enabledProviders.length === 0) {
		getLogger().info('LLM Batch Processing: Skipped - No enabled providers');
		return emptyStats(Date.now() - startTime);
	}

	// Get accounts that have journals requiring processing
	const accountsWithWork = await getAccountsWithRequiredJournals(db);

	getLogger().info(
		`LLM Batch Processing: Found ${accountsWithWork.length} accounts with journals requiring processing`
	);
	if (accountsWithWork.length === 0) {
		getLogger().info('LLM Batch Processing: No accounts with journals requiring processing');
		return emptyStats(Date.now() - startTime);
	}

	getLogger().info(`LLM Batch Processing: Processing ${accountsWithWork.length} accounts`);

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
			const result = await processAccount(db, account.id, finalConfig);

			stats.totalBatchesProcessed++;
			stats.totalJournalsProcessed += result.journalsProcessed;
			stats.totalSuggestionsCreated += result.suggestionsCreated;

			if (result.llmResponse) {
				const confidence = result.llmResponse.processingMetadata.averageConfidence;
				stats.averageConfidence = (stats.averageConfidence + confidence) / 2;
			}

			getLogger().info(
				`LLM Batch Processing: Account ${account.title} - ${result.journalsProcessed} journals processed`
			);
		} catch (error) {
			stats.errors++;
			getLogger().error(`LLM Batch Processing: Error processing account ${account.id}:`, error);
		}
	}

	stats.processingTime = Date.now() - startTime;
	getLogger().info(
		`LLM Batch Processing: Completed - ${stats.totalBatchesProcessed} batches, ${stats.totalJournalsProcessed} journals`
	);

	return stats;
}

/**
 * Process a specific account
 */
export async function processAccount(
	db: DBType,
	accountId: string,
	config: LLMBatchProcessingConfig
): Promise<BatchProcessingResult> {
	const startTime = Date.now();

	try {
		// Get uncategorized journals for this account
		const uncategorizedJournals = await getUncategorizedJournals(db, accountId, config);

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
		const context = await buildContext(db, accountId, uncategorizedJournals, config);

		// Call LLM for batch processing
		const llmResponse = await callLLMForBatch(db, context);

		// Process the LLM response (create items if enabled, store suggestions)
		const processResult = await processLLMResponse(db, llmResponse, config);

		// For now, just log the response - we'll implement suggestion storage later
		getLogger().info(`LLM Batch Processing Result for account ${accountId}:`, {
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
		getLogger().error(`LLM Batch Processing: Error processing account ${accountId}:`, error);
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
async function getAccountsWithRequiredJournals(
	db: DBType
): Promise<Array<{ id: string; title: string }>> {
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

	const result = await journalMaterialisedList({ db, filter });

	getLogger().info(
		`LLM Batch Processing: Found ${result.count} journals with status 'required' in asset/liability accounts (showing ${result.data.length})`
	);

	// Extract unique account IDs
	const accountIds = new Set(result.data.map((j) => j.accountId).filter(Boolean));

	getLogger().info(
		`LLM Batch Processing: Journals span ${accountIds.size} asset/liability accounts: ${Array.from(accountIds).join(', ')}`
	);

	// Get account details and verify they are asset/liability accounts
	const accounts = await Promise.all(
		Array.from(accountIds).map(async (id) => {
			const account = await accountActions.getById(id!);
			if (account && (account.type === 'asset' || account.type === 'liability')) {
				return { id: account.id, title: account.title, type: account.type };
			}
			return null;
		})
	);

	const validAccounts = accounts.filter(Boolean) as Array<{
		id: string;
		title: string;
		type: string;
	}>;
	getLogger().info(
		`LLM Batch Processing: Processing ${validAccounts.length} asset/liability accounts: ${validAccounts.map((a) => `${a.title} (${a.type})`).join(', ')}`
	);

	return validAccounts;
}

/**
 * Get uncategorized journals for an account (asset/liability accounts only)
 */
async function getUncategorizedJournals(
	db: DBType,
	accountId: string,
	config: LLMBatchProcessingConfig
): Promise<BatchJournalData[]> {
	const filter: JournalFilterSchemaInputType = {
		account: {
			idArray: [accountId],
			type: ['asset', 'liability']
		},
		llmReviewStatus: ['required'],
		page: 0,
		pageSize: config.maxUncategorizedJournals,
		orderBy: [
			{ field: 'date', direction: 'desc' } // Most recent first
		]
	};

	const result = await journalMaterialisedList({ db, filter });

	return result.data.map((journal) => ({
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
		llmReviewStatus: (journal.llmReviewStatus as any) || 'required'
	}));
}

/**
 * Build complete context using all enabled context builders
 */
async function buildContext(
	db: DBType,
	accountId: string,
	uncategorizedJournals: BatchJournalData[],
	config: LLMBatchProcessingConfig
): Promise<LLMBatchContext> {
	let context: Partial<LLMBatchContext> = {
		config,
		uncategorizedJournals
	};

	// Run each context builder
	const contextBuilders = [
		{ name: 'historical', enabled: true, priority: 1, build: buildHistoricalContext },
		{ name: 'fuzzy_match', enabled: true, priority: 2, build: buildFuzzyMatchContext },
		{ name: 'popular_items', enabled: true, priority: 3, build: buildPopularItemsContext }
	].sort((a, b) => a.priority - b.priority);

	for (const builder of contextBuilders) {
		if (!builder.enabled) continue;

		try {
			getLogger().debug(`LLM Batch Processing: Running context builder '${builder.name}'`);
			const builderContext = await builder.build({
				db,
				accountId,
				uncategorizedJournals,
				config
			});

			// Merge builder results into main context
			context = { ...context, ...builderContext };
		} catch (error) {
			getLogger().error(`LLM Batch Processing: Context builder '${builder.name}' failed:`, error);
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
async function callLLMForBatch(db: DBType, context: LLMBatchContext): Promise<LLMBatchResponse> {
	// Get first enabled LLM provider
	const allProviders = await llmActions.list({ db });
	const providers = allProviders.filter((p) => p.enabled);
	if (providers.length === 0) {
		throw new Error('No enabled LLM providers found');
	}

	const provider = providers[0];
	const llmSettings = await llmActions.getById({
		db,
		id: provider.id,
		includeApiKey: true
	});

	if (!llmSettings || !llmSettings.defaultModel) {
		throw new Error(`LLM provider ${provider.id} not configured properly`);
	}

	// Create LLM client
	const llmClient = createLLMClient(llmSettings, db);
	console.log('LLM Client', !!llmClient);

	// Build comprehensive prompt
	const prompt = buildBatchPrompt(context);

	// Log context for debugging
	getLogger().info('LLM Batch Context built:', {
		accountId: context.account.id,
		uncategorizedCount: context.uncategorizedJournals.length,
		historicalCount: context.historicalJournals.length,
		fuzzyMatchCount: context.fuzzyMatches.length,
		popularCategoriesCount: context.popularItems.categories.length
	});

	// Make actual LLM API call
	try {
		const llmRequest = {
			model: llmSettings.defaultModel!,
			messages: [
				{
					role: 'user' as const,
					content: prompt
				}
			],
			temperature: 0.1, // Low temperature for more consistent categorization
			max_tokens: 4000 // Enough for batch processing responses
		};

		getLogger().info('Making LLM API call for batch processing...');
		const llmResponse = await llmClient.call(llmRequest);

		// Parse the response
		const responseText = llmResponse.choices[0]?.message?.content;
		if (!responseText) {
			throw new Error('No response content from LLM');
		}

		// Try to parse JSON response
		let parsedResponse: LLMBatchResponse;
		try {
			// Extract JSON from response (in case there's extra text)
			const jsonMatch = responseText.match(/\{[\s\S]*\}/);
			const jsonText = jsonMatch ? jsonMatch[0] : responseText;
			parsedResponse = JSON.parse(jsonText);
		} catch (parseError) {
			getLogger().error('Failed to parse LLM JSON response:', parseError);
			getLogger().error('Raw response:', responseText);

			// Fallback to mock response if parsing fails
			throw new Error(`Failed to parse LLM response: ${parseError}`);
		}

		// Validate and enhance the response
		const enhancedResponse = validateAndEnhanceLLMResponse(parsedResponse, context);

		getLogger().info('LLM Batch Processing completed successfully:', {
			totalSuggestions: enhancedResponse.journalSuggestions.length,
			averageConfidence: enhancedResponse.processingMetadata.averageConfidence,
			patternsFound: enhancedResponse.batchInsights.patternsFound.length
		});

		return enhancedResponse;
	} catch (error) {
		getLogger().error('LLM Batch Processing failed:', error);

		// Return fallback response on error
		const fallbackResponse: LLMBatchResponse = {
			batchInsights: {
				patternsFound: ['Error occurred during processing'],
				historicalMatches: [],
				suggestedWorkflows: ['Manual categorization recommended']
			},
			journalSuggestions: context.uncategorizedJournals.map((journal) => ({
				journalId: journal.id,
				confidence: 0.0,
				reasoning: `Error during LLM processing: ${error instanceof Error ? error.message : 'Unknown error'}`,
				matchType: 'educated_guess' as const,
				confidenceFactors: ['Processing failed']
			})),
			processingMetadata: {
				totalJournalsProcessed: context.uncategorizedJournals.length,
				highConfidenceSuggestions: 0,
				mediumConfidenceSuggestions: 0,
				lowConfidenceSuggestions: 0,
				averageConfidence: 0.0
			}
		};

		return fallbackResponse;
	}
}

/**
 * Build structured JSON data for batch processing
 */
function buildBatchPrompt(context: LLMBatchContext): string {
	const {
		account,
		uncategorizedJournals,
		historicalJournals,
		fuzzyMatches,
		popularItems,
		allOptions
	} = context;

	// Build structured data for LLM
	const structuredData = {
		instruction:
			'You are a financial transaction categorization assistant. Your task is to analyze uncategorized journal entries and suggest appropriate categories, tags, bills, budgets, and labels based on historical patterns and context.',
		account: {
			id: account.id,
			title: account.title,
			type: account.type,
			processingCount: uncategorizedJournals.length
		},
		availableOptions: {
			categories: allOptions.categories
				.filter((c) => c.active)
				.map((c) => ({ id: c.id, title: c.title })),
			tags: allOptions.tags.filter((t) => t.active).map((t) => ({ id: t.id, title: t.title })),
			bills: allOptions.bills.filter((b) => b.active).map((b) => ({ id: b.id, title: b.title })),
			budgets: allOptions.budgets
				.filter((b) => b.active)
				.map((b) => ({ id: b.id, title: b.title })),
			labels: allOptions.labels.filter((l) => l.active).map((l) => ({ id: l.id, title: l.title }))
		},
		popularItems: {
			categories: popularItems.categories
				.slice(0, 5)
				.map((c) => ({ id: c.id, title: c.title, usageCount: c.usageCount })),
			tags: popularItems.tags
				.slice(0, 5)
				.map((t) => ({ id: t.id, title: t.title, usageCount: t.usageCount }))
		},
		historicalContext: {
			transactions: historicalJournals.slice(0, 10).map((j) => ({
				id: j.id,
				date: j.date.toISOString().split('T')[0],
				description: j.description,
				amount: j.amount,
				category: j.categoryTitle || null,
				tag: j.tagTitle || null,
				bill: j.billTitle || null,
				budget: j.budgetTitle || null
			})),
			totalCount: historicalJournals.length
		},
		fuzzyMatches: {
			transactions: fuzzyMatches.slice(0, 5).map((j) => ({
				id: j.id,
				description: j.description,
				amount: j.amount,
				category: j.categoryTitle || null,
				tag: j.tagTitle || null
			})),
			totalCount: fuzzyMatches.length
		},
		uncategorizedTransactions: uncategorizedJournals.map((j) => ({
			id: j.id,
			date: j.date.toISOString().split('T')[0],
			description: j.description,
			amount: j.amount,
			payee: j.payee || null,
			importDetail: j.importDetail || null
		})),
		instructions: {
			guidelines: [
				'For each uncategorized transaction, provide suggestions with high confidence scores only when you have strong evidence from the context',
				'Only suggest categories/tags/etc that exist in the available options',
				"Omit any field where you don't have a confident suggestion"
			],
			responseFormat: {
				batchInsights: {
					patternsFound: 'Array of patterns discovered',
					historicalMatches: 'Array of historical matches found',
					suggestedWorkflows: 'Array of workflow suggestions'
				},
				journalSuggestions: [
					{
						journalId: 'Required: ID of the journal',
						confidence: 'Required: 0.0-1.0 confidence score',
						suggestedCategory: 'Optional: category ID or name',
						suggestedTag: 'Optional: tag ID or name',
						suggestedBill: 'Optional: bill ID or name',
						suggestedBudget: 'Optional: budget ID or name',
						suggestedLabels: 'Optional: array of label IDs or names',
						suggestedPayee: 'Optional: suggested payee name',
						reasoning: 'Required: explanation of suggestions',
						matchType: 'Required: exact_historical|fuzzy_import|pattern_based|educated_guess',
						confidenceFactors: 'Required: array of factors supporting confidence'
					}
				],
				processingMetadata: {
					totalJournalsProcessed: uncategorizedJournals.length,
					highConfidenceSuggestions: 'Count of suggestions with confidence >= 0.8',
					mediumConfidenceSuggestions: 'Count of suggestions with confidence 0.5-0.79',
					lowConfidenceSuggestions: 'Count of suggestions with confidence < 0.5',
					averageConfidence: 'Average confidence across all suggestions'
				}
			}
		}
	};

	return `Please analyze this structured transaction data and provide categorization suggestions in the specified JSON format:

${JSON.stringify(structuredData, null, 2)}`;
}

/**
 * Validate and enhance LLM response
 */
function validateAndEnhanceLLMResponse(
	response: LLMBatchResponse,
	context: LLMBatchContext
): LLMBatchResponse {
	// Ensure all required fields exist
	if (!response.batchInsights) {
		response.batchInsights = {
			patternsFound: [],
			historicalMatches: [],
			suggestedWorkflows: []
		};
	}

	if (!response.journalSuggestions) {
		response.journalSuggestions = [];
	}

	if (!response.processingMetadata) {
		response.processingMetadata = {
			totalJournalsProcessed: context.uncategorizedJournals.length,
			highConfidenceSuggestions: 0,
			mediumConfidenceSuggestions: 0,
			lowConfidenceSuggestions: 0,
			averageConfidence: 0.0
		};
	}

	// Validate journal suggestions match input journals
	const inputJournalIds = new Set(context.uncategorizedJournals.map((j) => j.id));
	response.journalSuggestions = response.journalSuggestions.filter((suggestion) =>
		inputJournalIds.has(suggestion.journalId)
	);

	// Add missing journal suggestions with low confidence
	const suggestedJournalIds = new Set(response.journalSuggestions.map((s) => s.journalId));
	for (const journal of context.uncategorizedJournals) {
		if (!suggestedJournalIds.has(journal.id)) {
			response.journalSuggestions.push({
				journalId: journal.id,
				confidence: 0.1,
				reasoning: 'No suggestion from LLM - requires manual categorization',
				matchType: 'educated_guess' as const,
				confidenceFactors: ['No patterns found']
			});
		}
	}

	// Validate and clean suggestions
	response.journalSuggestions = response.journalSuggestions.map((suggestion) => ({
		...suggestion,
		confidence: Math.max(0, Math.min(1, suggestion.confidence || 0)),
		// Ensure all optional fields are properly typed
		suggestedPayee: suggestion.suggestedPayee || undefined,
		reasoning: suggestion.reasoning || 'No reasoning provided',
		matchType: suggestion.matchType || 'educated_guess',
		confidenceFactors: suggestion.confidenceFactors || []
	}));

	// Calculate processing metadata
	const highConfidence = response.journalSuggestions.filter((s) => s.confidence >= 0.8).length;
	const mediumConfidence = response.journalSuggestions.filter(
		(s) => s.confidence >= 0.5 && s.confidence < 0.8
	).length;
	const lowConfidence = response.journalSuggestions.filter((s) => s.confidence < 0.5).length;
	const totalConfidence = response.journalSuggestions.reduce((sum, s) => sum + s.confidence, 0);
	const averageConfidence =
		response.journalSuggestions.length > 0
			? totalConfidence / response.journalSuggestions.length
			: 0;

	response.processingMetadata = {
		totalJournalsProcessed: context.uncategorizedJournals.length,
		highConfidenceSuggestions: highConfidence,
		mediumConfidenceSuggestions: mediumConfidence,
		lowConfidenceSuggestions: lowConfidence,
		averageConfidence: Math.round(averageConfidence * 100) / 100
	};

	return response;
}

/**
 * Process LLM response (create items, store suggestions)
 */
async function processLLMResponse(
	db: DBType,
	response: LLMBatchResponse,
	config: LLMBatchProcessingConfig
): Promise<{
	itemsCreated?: {
		categories: number;
		tags: number;
		bills: number;
		budgets: number;
		labels: number;
	};
}> {
	console.log('Processing LLM response:', response, !!db, config);

	// This will be implemented in the next iteration
	return {};
}
