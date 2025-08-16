import { eq } from 'drizzle-orm';
import type { DBType } from '@totallator/database';
import { journalEntry } from '@totallator/database';
import { createLLMClient } from '../llm/modernClient';
import { getServerEnv } from '@/serverEnv';
import { getLogger } from '@/logger';
import { LLMContextService } from './llmContextService';
import * as z from 'zod';
import type {
	JournalTableType,
	AccountTableType,
	BillTableType,
	BudgetTableType,
	CategoryTableType,
	TagTableType
} from '@totallator/database';
import type { MostUsedItemsType } from './llmContextService';
import type { RecommendationType } from '../../actions/journalMaterializedViewActions';
import { llmActions } from '@/actions/llmActions';

// Define an expanded JournalTableType that includes related data
export type ExpandedJournalTableType = JournalTableType & {
	account?: AccountTableType;
	bill?: BillTableType;
	budget?: BudgetTableType;
	category?: CategoryTableType;
	tag?: TagTableType;
};

export interface LLMJournalProcessingOptions {
	/** Maximum number of journals to process in a single batch */
	batchSize?: number;
	/** Maximum processing time in milliseconds */
	maxProcessingTime?: number;
	/** Skip processing if no enabled LLM providers found */
	skipIfNoProviders?: boolean;
}

export interface LLMJournalProcessingResult {
	processed: number;
	errors: number;
	skipped: number;
	duration: number;
}

export class LLMJournalProcessingService {
	private db: DBType;
	private llmContextService: LLMContextService;

	constructor(db: DBType) {
		this.db = db;
		this.llmContextService = new LLMContextService(db);
	}

	/**
	 * Process journals that have llmReviewStatus = 'required'
	 */
	async processRequiredJournals(
		options: LLMJournalProcessingOptions = {}
	): Promise<LLMJournalProcessingResult> {
		const startTime = Date.now();
		const {
			batchSize = 50,
			maxProcessingTime = 60000, // 1 minute default
			skipIfNoProviders = true
		} = options;

		// Check if LLM review is enabled
		if (!getServerEnv().LLM_REVIEW_ENABLED) {
			getLogger('llm').pino.debug('LLM Journal Processing: Skipped - LLM_REVIEW_ENABLED is false');
			return { processed: 0, errors: 0, skipped: 0, duration: Date.now() - startTime };
		}

		// Get enabled LLM providers
		const allProviders = await llmActions.list();
		const enabledProviders = allProviders.filter((p) => p.enabled);

		if (enabledProviders.length === 0) {
			if (skipIfNoProviders) {
				getLogger('llm').pino.debug('LLM Journal Processing: Skipped - No enabled LLM providers found');
				return { processed: 0, errors: 0, skipped: 0, duration: Date.now() - startTime };
			} else {
				throw new Error('No enabled LLM providers found');
			}
		}

		const defaultProvider = enabledProviders[0]; // Use first enabled provider

		// Find journals that need processing
		const journalsToProcess = await this.db
			.select({
				id: journalEntry.id,
				description: journalEntry.description,
				amount: journalEntry.amount,
				accountId: journalEntry.accountId,
				categoryId: journalEntry.categoryId,
				tagId: journalEntry.tagId,
				billId: journalEntry.billId,
				budgetId: journalEntry.budgetId
			})
			.from(journalEntry)
			.where(eq(journalEntry.llmReviewStatus, 'required'))
			.limit(batchSize);

		if (journalsToProcess.length === 0) {
			getLogger('llm').pino.debug('LLM Journal Processing: No journals requiring processing found');
			return { processed: 0, errors: 0, skipped: 0, duration: Date.now() - startTime };
		}

		getLogger('llm').pino.info(
			{ journalsCount: journalsToProcess.length },
			`LLM Journal Processing: Starting batch processing of ${journalsToProcess.length} journals`
		);

		let processed = 0;
		let errors = 0;
		let skipped = 0;

		// Process journals one by one (to avoid overwhelming LLM providers)
		for (const journal of journalsToProcess) {
			// Check if we've exceeded max processing time
			if (Date.now() - startTime > maxProcessingTime) {
				getLogger('llm').pino.warn(
					{ maxProcessingTime },
					`LLM Journal Processing: Stopping due to time limit (${maxProcessingTime}ms)`
				);
				break;
			}

			try {
				await this.processJournal(journal, defaultProvider);
				processed++;
				getLogger('llm').pino.debug(
					{ journalId: journal.id },
					`LLM Journal Processing: Successfully processed journal ${journal.id}`
				);
			} catch (error) {
				errors++;
				getLogger('llm').pino.error(
					{ journalId: journal.id, error },
					`LLM Journal Processing: Error processing journal ${journal.id}`
				);

				// Mark journal as error status
				await this.db
					.update(journalEntry)
					.set({ llmReviewStatus: 'error' })
					.where(eq(journalEntry.id, journal.id));
			}
		}

		const duration = Date.now() - startTime;
		getLogger('llm').pino.info(
			{ processed, errors, skipped, duration },
			`LLM Journal Processing: Completed batch - Processed: ${processed}, Errors: ${errors}, Duration: ${duration}ms`
		);

		return { processed, errors, skipped, duration };
	}

	/**
	 * Process a single journal entry using LLM
	 */
	private async processJournal(
		journal: {
			id: string;
			description: string | null;
			amount: number;
			accountId: string | null;
			categoryId: string | null;
			tagId: string | null;
			billId: string | null;
			budgetId: string | null;
		},
		llmProvider: { id: string; title: string; apiUrl: string; defaultModel: string | null }
	): Promise<void> {
		// Get LLM settings with API key
		const llmSettings = await llmActions.getById({
			id: llmProvider.id,
			includeApiKey: true
		});

		if (!llmSettings || !llmSettings.defaultModel) {
			throw new Error(`LLM provider ${llmProvider.id} not found or missing default model`);
		}

		// Create LLM client instance
		const llmClient = createLLMClient(llmSettings, this.db);

		// Fetch additional context
		const [latestJournals, mostUsedItems, existingRecommendations] = await Promise.all([
			this.llmContextService.getLatestJournalsForAccount(journal.accountId || '', 5), // Latest 5 journals
			this.llmContextService.getMostUsedItems(10), // Top 10 most used items
			this.llmContextService.getExistingRecommendations(journal.id)
		]);

		// Define the Zod schema for the expected LLM output
		const LLMJournalSuggestionSchema = z.object({
			recommendations: z
				.array(
					z.object({
						description: z.string().optional().describe('Suggested description update'),
						payee: z.string().optional().describe('Suggested payee name'),
						category: z.string().optional().describe('Suggested category ID or name'),
						tag: z.string().optional().describe('Suggested tag ID or name'),
						bill: z.string().optional().describe('Suggested bill ID or name'),
						budget: z.string().optional().describe('Suggested budget ID or name')
					})
				)
				.describe('Array of recommended options for the journal')
		});

		// Prepare the prompt for journal categorization with enhanced context
		const prompt = this.buildJournalCategorizationPrompt(
			journal,
			latestJournals,
			mostUsedItems,
			existingRecommendations || []
		);

		// Call LLM with structured output capability
		const response = await llmClient.callStructured(
			{
				model: llmSettings.defaultModel,
				messages: [
					{
						role: 'user',
						content: prompt
					}
				],
				schema: LLMJournalSuggestionSchema
			},
			journal.id
		);

		// Process the structured response
		if (response.object_data && response.object_data.recommendations.length > 0) {
			// Here you would typically save the recommendations to the database
			// For now, we'll just mark as complete if we got a structured response
			await this.db
				.update(journalEntry)
				.set({ llmReviewStatus: 'complete' })
				.where(eq(journalEntry.id, journal.id));
		} else {
			// If no structured recommendations, mark as error or complete based on desired behavior
			await this.db
				.update(journalEntry)
				.set({ llmReviewStatus: 'error' })
				.where(eq(journalEntry.id, journal.id));
		}
	}

	/**
	 * Build a structured JSON prompt for journal categorization
	 */
	private buildJournalCategorizationPrompt(
		journal: {
			id: string;
			description: string | null;
			amount: number;
			accountId: string | null;
			categoryId: string | null;
			tagId: string | null;
			billId: string | null;
			budgetId: string | null;
		},
		latestJournals: ExpandedJournalTableType[],
		mostUsedItems: MostUsedItemsType,
		existingRecommendations: RecommendationType[]
	): string {
		const amount = Math.abs(journal.amount);
		const isExpense = journal.amount < 0;
		const isIncome = journal.amount > 0;
		const transactionType = isExpense ? 'expense' : isIncome ? 'income' : 'transfer';

		const structuredData = {
			instruction:
				'You are a financial categorization expert. Analyze this transaction and provide accurate categorization suggestions in the specified JSON format.',
			transaction: {
				description: journal.description || 'No description',
				amount: journal.amount,
				amountMagnitude: amount,
				type: transactionType,
				isExpense,
				isIncome
			},
			context: {
				guidelines: [
					'Look for merchant names, transaction types, and patterns in the description',
					"Consider common abbreviations (e.g., 'SQ *' = Square payments, 'TST*' = Toast POS, 'AMZN' = Amazon)",
					'Be conservative with confidence - only high if very certain'
				],
				transactionType: `This is a ${transactionType} transaction`,
				latestJournals: latestJournals.map((j) => ({
					description: j.description,
					amount: j.amount,
					category: j.category ? j.category.title : undefined,
					tag: j.tag ? j.tag.title : undefined,
					bill: j.bill ? j.bill.title : undefined,
					budget: j.budget ? j.budget.title : undefined
				})),
				mostUsedItems: {
					tags: mostUsedItems.mostUsedTags.map((item) => item.title),
					categories: mostUsedItems.mostUsedCategories.map((item) => item.title),
					bills: mostUsedItems.mostUsedBills.map((item) => item.title),
					budgets: mostUsedItems.mostUsedBudgets.map((item) => item.title)
				},
				existingRecommendations: existingRecommendations || []
			},
			requiredOutputFormat:
				"Return a JSON object with a single key 'recommendations' which is an array of objects. Each object in the array should have the following keys: 'description', 'payee', 'category', 'tag', 'bill', 'budget'. All keys are optional strings.",
			finalInstruction:
				'Please provide your recommendations in the specified JSON format. Do NOT include any other text or markdown outside the JSON.'
		};

		return `Please analyze this transaction data structure and provide categorization suggestions:\n\n${JSON.stringify(structuredData, null, 2)}`;
	}
}
