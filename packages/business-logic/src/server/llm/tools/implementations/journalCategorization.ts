import { categoryActions } from '@/actions/categoryActions';
import type { Tool, ToolExecutionContext, ToolExecutionResult } from '../types';
import { tagActions } from '@/actions/tagActions';
import { billActions } from '@/actions/billActions';
import { budgetActions } from '@/actions/budgetActions';
import { journalLlmSuggestionActions } from '@/actions/journalLlmSuggestionActions';

export const journalCategorizationTool: Tool = {
	definition: {
		name: 'journal_categorization',
		description:
			'Analyze a transaction and suggest categorization including payee, category, tags, bills, budgets, and target account. Returns suggestions with confidence scores and reasoning.',
		parameters: {
			transaction: {
				type: 'object',
				description: 'Transaction details to analyze',
				properties: {
					description: {
						type: 'string',
						description: 'Transaction description to analyze'
					},
					amount: {
						type: 'number',
						description: 'Transaction amount (negative for expenses, positive for income)'
					},
					date: {
						type: 'string',
						description: 'Transaction date in YYYY-MM-DD format (optional)'
					},
					accountId: {
						type: 'string',
						description: 'Source account ID (optional)'
					}
				}
			},
			suggestions: {
				type: 'object',
				description: 'Your categorization suggestions based on analysis',
				properties: {
					payee: {
						type: 'string',
						description: 'Suggested payee/merchant name (cleaned and standardized)'
					},
					description: {
						type: 'string',
						description: 'Improved/cleaned transaction description (optional)'
					},
					category: {
						type: 'string',
						description: 'Suggested category name (will be created if not exists)'
					},
					tag: {
						type: 'string',
						description: 'Suggested tag name (optional, will be created if not exists)'
					},
					bill: {
						type: 'string',
						description: 'Suggested bill title for recurring payments (optional)'
					},
					budget: {
						type: 'string',
						description: 'Suggested budget category (optional)'
					},
					confidence: {
						type: 'number',
						description: 'Confidence score from 0.0 to 1.0 (be conservative)'
					},
					reasoning: {
						type: 'string',
						description: 'Clear explanation of why you made these suggestions'
					}
				}
			}
		},
		required: ['transaction', 'suggestions']
	},

	async execute(
		parameters: Record<string, any>,
		context: ToolExecutionContext
	): Promise<ToolExecutionResult> {
		try {
			const { transaction, suggestions } = parameters;

			if (!transaction || typeof transaction !== 'object') {
				return {
					success: false,
					error: 'transaction parameter must be an object'
				};
			}

			if (!suggestions || typeof suggestions !== 'object') {
				return {
					success: false,
					error: 'suggestions parameter must be an object with your categorization analysis'
				};
			}

			const { description } = transaction;
			const { payee, category, tag, bill, budget, confidence, reasoning } = suggestions;

			if (!description || typeof description !== 'string') {
				return {
					success: false,
					error: 'transaction.description must be a non-empty string'
				};
			}

			if (!payee || typeof payee !== 'string') {
				return {
					success: false,
					error: 'suggestions.payee must be a non-empty string'
				};
			}

			let categoryId: string | undefined;
			let tagId: string | undefined;
			let billId: string | undefined;
			let budgetId: string | undefined;

			// Create/get category if suggested
			if (category && typeof category === 'string' && category.trim()) {
				try {
					const categoryResult = await categoryActions.createOrGet({
						title: category.trim(),
						requireActive: false
					});
					categoryId = categoryResult?.id;
				} catch (error) {
					// If category creation fails, continue without it
					console.warn('Failed to create/get category:', category, error);
				}
			}

			// Create/get tag if suggested
			if (tag && typeof tag === 'string' && tag.trim()) {
				try {
					const tagResult = await tagActions.createOrGet({
						title: tag.trim(),
						requireActive: false
					});
					tagId = tagResult?.id;
				} catch (error) {
					console.warn('Failed to create/get tag:', tag, error);
				}
			}

			// Create/get bill if suggested
			if (bill && typeof bill === 'string' && bill.trim()) {
				try {
					const billResult = await billActions.createOrGet({
						title: bill.trim(),
						requireActive: false
					});
					billId = billResult?.id;
				} catch (error) {
					console.warn('Failed to create/get bill:', bill, error);
				}
			}

			// Create/get budget if suggested
			if (budget && typeof budget === 'string' && budget.trim()) {
				try {
					const budgetResult = await budgetActions.createOrGet({
						title: budget.trim(),
						requireActive: false
					});
					budgetId = budgetResult?.id;
				} catch (error) {
					console.warn('Failed to create/get budget:', budget, error);
				}
			}

			// Create the LLM suggestion record if we have a journal context
			if (context.journalId) {
				try {
					await journalLlmSuggestionActions.create({
						data: {
							journalId: context.journalId,
							llmSettingsId: 'system', // We'll need to pass this properly
							suggestedPayee: payee,
							suggestedDescription: suggestions.description || undefined,
							suggestedCategoryId: categoryId,
							suggestedTagId: tagId,
							suggestedBillId: billId,
							suggestedBudgetId: budgetId,
							confidenceScore: typeof confidence === 'number' ? confidence : 0.5,
							reasoning: reasoning || 'LLM analysis'
						}
					});
				} catch (error) {
					console.warn('Failed to create LLM suggestion record:', error);
				}
			}

			return {
				success: true,
				data: {
					payee,
					description: suggestions.description || description,
					categoryId,
					tagId,
					billId,
					budgetId,
					confidence: typeof confidence === 'number' ? confidence : 0.5,
					reasoning: reasoning || 'LLM categorization analysis',
					suggestedItems: {
						category: category || undefined,
						tag: tag || undefined,
						bill: bill || undefined,
						budget: budget || undefined
					}
				}
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to analyze transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		}
	}
};
