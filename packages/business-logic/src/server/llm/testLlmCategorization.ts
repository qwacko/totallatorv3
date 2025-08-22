import type { DBType } from '@totallator/database';

import { LLMJournalProcessingService } from '../services/llmJournalProcessingService';

/**
 * Test script for LLM categorization
 * Usage: Call this function with test transaction data to see how the LLM categorizes them
 */
export async function testLlmCategorization(
	db: DBType,
	testTransactions: Array<{
		description: string;
		amount: number;
		expectedCategory?: string;
		expectedPayee?: string;
	}>
) {
	const llmProcessor = new LLMJournalProcessingService(db);

	console.log('🧪 Testing LLM Categorization');
	console.log('================================');

	for (const [index, transaction] of testTransactions.entries()) {
		console.log(`\n📄 Test ${index + 1}:`);
		console.log(`Description: "${transaction.description}"`);
		console.log(`Amount: $${transaction.amount}`);

		if (transaction.expectedCategory) {
			console.log(`Expected Category: ${transaction.expectedCategory}`);
		}
		if (transaction.expectedPayee) {
			console.log(`Expected Payee: ${transaction.expectedPayee}`);
		}

		try {
			// Test the prompt building
			const prompt = (llmProcessor as any).buildJournalCategorizationPrompt({
				description: transaction.description,
				amount: transaction.amount
			});

			console.log(`\n📝 Generated Prompt Preview:`);
			console.log(prompt.substring(0, 200) + '...');
		} catch (error) {
			console.error(`❌ Error testing transaction ${index + 1}:`, error);
		}

		console.log('---');
	}
}

/**
 * Sample test data for common transaction types
 */
export const sampleTestTransactions = [
	{
		description: 'AMAZON.COM*M12ABC123 AMZN.COM/BILLWA',
		amount: -45.67,
		expectedCategory: 'Shopping',
		expectedPayee: 'Amazon'
	},
	{
		description: 'SQ *COFFEE CORNER Seattle WA',
		amount: -8.5,
		expectedCategory: 'Dining',
		expectedPayee: 'Coffee Corner'
	},
	{
		description: 'SHELL OIL 12345678 SEATTLE WA',
		amount: -52.3,
		expectedCategory: 'Transportation',
		expectedPayee: 'Shell'
	},
	{
		description: 'COSTCO WHOLESALE #123 BELLEVUE WA',
		amount: -127.84,
		expectedCategory: 'Groceries',
		expectedPayee: 'Costco'
	},
	{
		description: 'ACH DIRECT DEP SALARY COMPANY INC',
		amount: 3250.0,
		expectedCategory: 'Income',
		expectedPayee: 'Company Inc'
	},
	{
		description: 'ELECTRIC BILL PSE 04/15',
		amount: -89.45,
		expectedCategory: 'Utilities',
		expectedPayee: 'PSE'
	},
	{
		description: 'RECURRING PMT MORTGAGE LENDER',
		amount: -1245.0,
		expectedCategory: 'Housing',
		expectedPayee: 'Mortgage Lender'
	},
	{
		description: 'VENMO *JOHN-SMITH',
		amount: -25.0,
		expectedCategory: 'Transfer',
		expectedPayee: 'John Smith'
	}
];

/**
 * Interactive test for checking specific transaction patterns
 */
export function analyzeTransactionPattern(description: string, amount: number) {
	const isExpense = amount < 0;
	const absAmount = Math.abs(amount);

	console.log(`\n🔍 Analyzing: "${description}" ($${amount})`);

	// Common patterns to look for
	const patterns = {
		amazon: /amazon|amzn/i,
		square: /sq\s*\*|square/i,
		venmo: /venmo/i,
		paypal: /paypal|pp\*/i,
		uber: /uber/i,
		lyft: /lyft/i,
		starbucks: /starbucks|sbux/i,
		shell: /shell/i,
		costco: /costco/i,
		target: /target/i,
		grocery: /grocery|supermarket|safeway|qfc|kroger/i,
		restaurant: /restaurant|cafe|pizza|mcdonald|burger/i,
		gas: /gas|fuel|exxon|chevron|bp\s/i,
		utility: /electric|gas\sbill|water|utility|pse|pge/i,
		salary: /salary|payroll|direct\sdep/i,
		mortgage: /mortgage|rent/i,
		bank: /bank|atm|fee/i
	};

	const matches = Object.entries(patterns)
		.filter(([_, pattern]) => pattern.test(description))
		.map(([name]) => name);

	console.log(`Detected patterns: ${matches.length > 0 ? matches.join(', ') : 'none'}`);

	// Category suggestions based on patterns and amount
	let suggestedCategory = 'Other';
	if (matches.includes('amazon') || matches.includes('target') || matches.includes('costco')) {
		suggestedCategory = absAmount > 100 ? 'Shopping' : 'Household';
	} else if (matches.includes('grocery')) {
		suggestedCategory = 'Groceries';
	} else if (matches.includes('restaurant') || matches.includes('starbucks')) {
		suggestedCategory = 'Dining';
	} else if (matches.includes('gas') || matches.includes('shell')) {
		suggestedCategory = 'Transportation';
	} else if (matches.includes('utility')) {
		suggestedCategory = 'Utilities';
	} else if (matches.includes('salary')) {
		suggestedCategory = 'Income';
	} else if (matches.includes('mortgage')) {
		suggestedCategory = 'Housing';
	} else if (matches.includes('venmo') || matches.includes('paypal')) {
		suggestedCategory = 'Transfer';
	}

	console.log(`Suggested category: ${suggestedCategory}`);
	console.log(`Transaction type: ${isExpense ? 'Expense' : 'Income'}`);

	return {
		patterns: matches,
		suggestedCategory,
		isExpense,
		absAmount
	};
}
