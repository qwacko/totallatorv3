import type { Tool, ToolExecutionContext, ToolExecutionResult } from '../types';
import { dbExecuteLogger } from '../../../db/dbLogger';
import { account, category, tag, bill, budget } from '../../../db/postgres/schema';
import { eq } from 'drizzle-orm';

export const journalCategorizationTool: Tool = {
	definition: {
		name: 'journal_categorization',
		description: 'Analyze a transaction and suggest categorization including payee, category, tags, bills, budgets, and target account based on description and amount.',
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
						description: 'Transaction amount'
					},
					date: {
						type: 'string',
						description: 'Transaction date in YYYY-MM-DD format'
					},
					accountId: {
						type: 'string',
						description: 'Source account ID'
					}
				}
			}
		},
		required: ['transaction']
	},

	async execute(
		parameters: Record<string, any>,
		context: ToolExecutionContext
	): Promise<ToolExecutionResult> {
		try {
			const { transaction } = parameters;

			if (!transaction || typeof transaction !== 'object') {
				return {
					success: false,
					error: 'transaction parameter must be an object'
				};
			}

			const { description, amount, date, accountId } = transaction;

			if (!description || typeof description !== 'string') {
				return {
					success: false,
					error: 'transaction.description must be a non-empty string'
				};
			}

			// Get available accounts, categories, tags, bills, and budgets for context
			const [accounts, categories, tags, bills, budgets] = await Promise.all([
				dbExecuteLogger(
					context.db.select({ id: account.id, title: account.title }).from(account),
					'Journal Categorization - Get Accounts'
				),
				dbExecuteLogger(
					context.db.select({ id: category.id, name: category.name }).from(category),
					'Journal Categorization - Get Categories'
				),
				dbExecuteLogger(
					context.db.select({ id: tag.id, name: tag.name }).from(tag),
					'Journal Categorization - Get Tags'
				),
				dbExecuteLogger(
					context.db.select({ id: bill.id, title: bill.title }).from(bill),
					'Journal Categorization - Get Bills'
				),
				dbExecuteLogger(
					context.db.select({ id: budget.id, title: budget.title }).from(budget),
					'Journal Categorization - Get Budgets'
				)
			]);

			// Create contextual information for the LLM
			const availableOptions = {
				accounts: accounts.map(a => ({ id: a.id, title: a.title })),
				categories: categories.map(c => ({ id: c.id, name: c.name })),
				tags: tags.map(t => ({ id: t.id, name: t.name })),
				bills: bills.map(b => ({ id: b.id, title: b.title })),
				budgets: budgets.map(b => ({ id: b.id, title: b.title }))
			};

			// Analyze the transaction description and amount to suggest categorization
			const analysis = analyzeTransaction(description, amount, availableOptions);

			return {
				success: true,
				data: {
					payee: analysis.payee,
					description: analysis.description || description,
					categoryId: analysis.categoryId,
					tagId: analysis.tagId,
					billId: analysis.billId,
					budgetId: analysis.budgetId,
					accountId: analysis.accountId,
					confidence: analysis.confidence,
					reasoning: analysis.reasoning
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

/**
 * Analyze transaction and suggest categorization
 * This is a simplified analysis that would typically be enhanced with ML/LLM calls
 */
function analyzeTransaction(
	description: string, 
	amount: number, 
	options: {
		accounts: Array<{ id: string; title: string }>;
		categories: Array<{ id: string; name: string }>;
		tags: Array<{ id: string; name: string }>;
		bills: Array<{ id: string; title: string }>;
		budgets: Array<{ id: string; title: string }>;
	}
) {
	const desc = description.toLowerCase();
	let payee = '';
	let categoryId: string | undefined;
	let tagId: string | undefined;
	let billId: string | undefined;
	let budgetId: string | undefined;
	let accountId: string | undefined;
	let confidence = 0.7;
	let reasoning = 'Based on transaction description analysis';

	// Extract payee from common patterns
	if (desc.includes('amazon')) {
		payee = 'Amazon';
		categoryId = options.categories.find(c => c.name.toLowerCase().includes('shopping'))?.id;
	} else if (desc.includes('grocery') || desc.includes('supermarket')) {
		payee = 'Grocery Store';
		categoryId = options.categories.find(c => c.name.toLowerCase().includes('groceries') || c.name.toLowerCase().includes('food'))?.id;
	} else if (desc.includes('gas') || desc.includes('fuel')) {
		payee = 'Gas Station';
		categoryId = options.categories.find(c => c.name.toLowerCase().includes('fuel') || c.name.toLowerCase().includes('gas'))?.id;
	} else if (desc.includes('restaurant') || desc.includes('cafe')) {
		payee = 'Restaurant';
		categoryId = options.categories.find(c => c.name.toLowerCase().includes('dining') || c.name.toLowerCase().includes('restaurant'))?.id;
	} else if (desc.includes('utility') || desc.includes('electric') || desc.includes('water')) {
		payee = 'Utility Company';
		categoryId = options.categories.find(c => c.name.toLowerCase().includes('utilities'))?.id;
		billId = options.bills.find(b => b.title.toLowerCase().includes('utility') || b.title.toLowerCase().includes('electric') || b.title.toLowerCase().includes('water'))?.id;
	} else {
		// Try to extract a payee name from the description
		const words = description.split(' ');
		payee = words.slice(0, 2).join(' ').replace(/[^a-zA-Z0-9\s]/g, '').trim();
		if (!payee) {
			payee = 'Unknown Payee';
		}
	}

	// Adjust confidence based on matches found
	if (categoryId) confidence += 0.1;
	if (billId) confidence += 0.1;
	if (payee !== 'Unknown Payee') confidence += 0.05;

	// Cap confidence at 0.95
	confidence = Math.min(confidence, 0.95);

	return {
		payee,
		description: undefined, // Keep original description
		categoryId,
		tagId,
		billId,
		budgetId,
		accountId,
		confidence,
		reasoning: `Analyzed "${description}" and suggested categorization based on common patterns. ${categoryId ? 'Found matching category. ' : ''}${billId ? 'Found matching bill. ' : ''}`
	};
}