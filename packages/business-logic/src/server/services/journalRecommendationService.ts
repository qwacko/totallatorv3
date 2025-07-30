import type { DBType } from '@totallator/database';
import type { RecommendationType } from '@/actions/journalMaterializedViewActions';
import { journalLlmSuggestionActions } from '@/actions/journalLlmSuggestionActions';
import { llmActions } from '@/actions/llmActions';
import { ToolDispatcher } from '../llm/tools/dispatcher';
import type { ToolExecutionContext } from '../llm/tools/types';

export type JournalRecommendationServiceInput = {
	id: string;
	description: string;
	dataChecked: boolean;
	accountId: string;
	amount: number;
	date: Date;
	importDetail?: { dataToUse?: any } | null;
};

export type EnhancedRecommendationType = RecommendationType & {
	source: 'similarity' | 'llm';
	llmConfidence?: number;
	llmReasoning?: string;
	llmSuggestionId?: string;
};

/**
 * Journal Recommendation Service
 *
 * Generates LLM-powered recommendations for journal entries that integrate
 * with the existing recommendation modal system. Works alongside the current
 * similarity-based recommendations.
 */
export const journalRecommendationService = {
	/**
	 * Generate LLM recommendations for a journal entry
	 */
	generateLLMRecommendations: async ({
		db,
		journal,
		llmSettingsId
	}: {
		db: DBType;
		journal: JournalRecommendationServiceInput;
		llmSettingsId?: string;
	}): Promise<EnhancedRecommendationType[]> => {
		// Only generate recommendations for unchecked entries with descriptions
		if (journal.dataChecked || !journal.description) {
			return [];
		}

		// Get enabled LLM provider if none specified
		if (!llmSettingsId) {
			const enabledProviders = await llmActions.getEnabled({ db });
			if (enabledProviders.length === 0) {
				return [];
			}
			llmSettingsId = enabledProviders[0].id;
		}

		const llmProvider = await llmActions.getById({ db, id: llmSettingsId });
		if (!llmProvider) {
			return [];
		}

		try {
			// Create tool dispatcher and execution context
			const dispatcher = new ToolDispatcher();
			const context: ToolExecutionContext = {
				db,
				userId: undefined, // Will be provided by calling code if needed
				journalId: journal.id
			};

			// Call the journal categorization tool
			const toolResponse = await dispatcher.executeToolCall(
				{
					name: 'journal_categorization',
					parameters: {
						transaction: {
							description: journal.description,
							amount: journal.amount,
							date: journal.date.toISOString().split('T')[0],
							accountId: journal.accountId
						}
					}
				},
				context
			);

			if (!toolResponse.result.success) {
				console.error('LLM journal categorization failed:', toolResponse.result.error);
				return [];
			}

			// Parse tool response
			const suggestion = toolResponse.result.data;
			if (!suggestion) return [];

			// Create LLM suggestion record
			const llmSuggestion = await journalLlmSuggestionActions.create({
				db,
				data: {
					journalId: journal.id,
					llmSettingsId,
					suggestedPayee: suggestion.payee,
					suggestedDescription: suggestion.description,
					suggestedCategoryId: suggestion.categoryId,
					suggestedTagId: suggestion.tagId,
					suggestedBillId: suggestion.billId,
					suggestedBudgetId: suggestion.budgetId,
					suggestedAccountId: suggestion.accountId,
					confidenceScore: suggestion.confidence || 0.8,
					reasoning: suggestion.reasoning
				}
			});

			// Convert to RecommendationType format for existing modal system
			const recommendation: EnhancedRecommendationType = {
				journalId: journal.id,
				journalBillId: suggestion.billId || undefined,
				journalBudgetId: suggestion.budgetId || undefined,
				journalCategoryId: suggestion.categoryId || undefined,
				journalTagId: suggestion.tagId || undefined,
				journalAccountId: journal.accountId,
				journalDescription: suggestion.description || journal.description,
				journalDate: journal.date,
				journalAmount: journal.amount,
				journalDataChecked: journal.dataChecked,
				payeeAccountId: suggestion.accountId || journal.accountId,
				checkSimilarity: suggestion.confidence || 0.8, // Use LLM confidence as similarity score
				checkDescription: suggestion.payee || 'LLM Suggestion',
				searchDescription: journal.description,
				// Enhanced fields
				source: 'llm',
				llmConfidence: suggestion.confidence ?? undefined,
				llmReasoning: suggestion.reasoning ?? undefined,
				llmSuggestionId: llmSuggestion.id
			};

			return [recommendation];
		} catch (error) {
			console.error('Error generating LLM recommendations:', error);

			// Note: llmLogActions doesn't have a create method
			// Logging will be handled by the tool dispatcher or LLM layer
			console.error('LLM service error for journal:', journal.id, error);

			return [];
		}
	},

	/**
	 * Get existing LLM suggestions for a journal
	 */
	getExistingLLMRecommendations: async ({
		db,
		journalId
	}: {
		db: DBType;
		journalId: string;
	}): Promise<EnhancedRecommendationType[]> => {
		const suggestions = await journalLlmSuggestionActions.getByJournalId({
			db,
			journalId
		});

		return suggestions.map((suggestion) => ({
			journalId: suggestion.journalId,
			journalBillId: suggestion.suggestedBillId || undefined,
			journalBudgetId: suggestion.suggestedBudgetId || undefined,
			journalCategoryId: suggestion.suggestedCategoryId || undefined,
			journalTagId: suggestion.suggestedTagId || undefined,
			journalAccountId: suggestion.journalId, // Will need to be fetched from journal
			journalDescription: suggestion.suggestedDescription || '',
			journalDate: new Date(), // Will need to be fetched from journal
			journalAmount: 0, // Will need to be fetched from journal
			journalDataChecked: false,
			payeeAccountId: suggestion.suggestedAccountId || '',
			checkSimilarity: suggestion.confidenceScore || 0.8,
			checkDescription: suggestion.suggestedPayee || 'LLM Suggestion',
			searchDescription: '',
			// Enhanced fields
			source: 'llm',
			llmConfidence: suggestion.confidenceScore ?? undefined,
			llmReasoning: suggestion.reasoning ?? undefined,
			llmSuggestionId: suggestion.id
		}));
	},

	/**
	 * Mark an LLM suggestion as accepted
	 */
	acceptLLMSuggestion: async ({
		db,
		suggestionId,
		userId
	}: {
		db: DBType;
		suggestionId: string;
		userId: string;
	}): Promise<void> => {
		await journalLlmSuggestionActions.update({
			db,
			id: suggestionId,
			data: {
				status: 'accepted',
				processedBy: userId
			}
		});
	},

	/**
	 * Mark an LLM suggestion as rejected
	 */
	rejectLLMSuggestion: async ({
		db,
		suggestionId,
		userId
	}: {
		db: DBType;
		suggestionId: string;
		userId: string;
	}): Promise<void> => {
		await journalLlmSuggestionActions.update({
			db,
			id: suggestionId,
			data: {
				status: 'rejected',
				processedBy: userId
			}
		});
	}
};
