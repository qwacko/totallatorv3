import { eq, and } from 'drizzle-orm';
import type { DBType } from '../db/db';
import { journalEntry } from '../db/postgres/schema';
import { LLMClient } from '../llm/client';
import { ToolDispatcher } from '../llm/tools/dispatcher';
import { tActions } from '../db/actions/tActions';
import { serverEnv } from '../serverEnv';
import { logging } from '../logging';

export interface LLMJournalProcessingOptions {
	/** Maximum number of journals to process in a single batch */
	batchSize?: number;
	/** Maximum processing time in milliseconds */
	maxProcessingTime?: number;
	/** Skip processing if no enabled LLM providers found */
	skipIfNoProviders?: boolean;
}

export class LLMJournalProcessingService {
	private db: DBType;
	private toolDispatcher: ToolDispatcher;

	constructor(db: DBType) {
		this.db = db;
		this.toolDispatcher = new ToolDispatcher();
	}

	/**
	 * Process journals that have llmReviewStatus = 'required'
	 */
	async processRequiredJournals(options: LLMJournalProcessingOptions = {}): Promise<{
		processed: number;
		errors: number;
		skipped: number;
		duration: number;
	}> {
		const startTime = Date.now();
		const { 
			batchSize = 50, 
			maxProcessingTime = 60000, // 1 minute default
			skipIfNoProviders = true 
		} = options;

		// Check if LLM review is enabled
		if (!serverEnv.LLM_REVIEW_ENABLED) {
			logging.debug('LLM Journal Processing: Skipped - LLM_REVIEW_ENABLED is false');
			return { processed: 0, errors: 0, skipped: 0, duration: Date.now() - startTime };
		}

		// Get enabled LLM providers
		const allProviders = await tActions.llm.list({ db: this.db });
		const enabledProviders = allProviders.filter(p => p.enabled);

		if (enabledProviders.length === 0) {
			if (skipIfNoProviders) {
				logging.debug('LLM Journal Processing: Skipped - No enabled LLM providers found');
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
			logging.debug('LLM Journal Processing: No journals requiring processing found');
			return { processed: 0, errors: 0, skipped: 0, duration: Date.now() - startTime };
		}

		logging.info(`LLM Journal Processing: Starting batch processing of ${journalsToProcess.length} journals`);

		let processed = 0;
		let errors = 0;
		let skipped = 0;

		// Process journals one by one (to avoid overwhelming LLM providers)
		for (const journal of journalsToProcess) {
			// Check if we've exceeded max processing time
			if (Date.now() - startTime > maxProcessingTime) {
				logging.warn(`LLM Journal Processing: Stopping due to time limit (${maxProcessingTime}ms)`);
				break;
			}

			try {
				await this.processJournal(journal, defaultProvider);
				processed++;
				logging.debug(`LLM Journal Processing: Successfully processed journal ${journal.id}`);
			} catch (error) {
				errors++;
				logging.error(`LLM Journal Processing: Error processing journal ${journal.id}:`, error);
				
				// Mark journal as error status
				await this.db
					.update(journalEntry)
					.set({ llmReviewStatus: 'error' })
					.where(eq(journalEntry.id, journal.id));
			}
		}

		const duration = Date.now() - startTime;
		logging.info(`LLM Journal Processing: Completed batch - Processed: ${processed}, Errors: ${errors}, Duration: ${duration}ms`);

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
		llmProvider: { id: string; title: string; apiUrl: string; defaultModel: string | null; }
	): Promise<void> {
		// Get LLM settings with API key
		const llmSettings = await tActions.llm.getById({ 
			db: this.db, 
			id: llmProvider.id, 
			includeApiKey: true 
		});

		if (!llmSettings || !llmSettings.defaultModel) {
			throw new Error(`LLM provider ${llmProvider.id} not found or missing default model`);
		}

		// Create LLM client instance
		const llmClient = new LLMClient(llmSettings, this.db);

		// Prepare the prompt for journal categorization
		const prompt = this.buildJournalCategorizationPrompt(journal);

		// Call LLM with tool calling capability
		const response = await llmClient.call({
			model: llmSettings.defaultModel,
			messages: [
				{
					role: 'user',
					content: prompt
				}
			],
			tools: this.toolDispatcher.getToolDefinitions()
		}, journal.id);

		// Process any tool calls from the LLM response
		const toolCalls = response.choices[0]?.message?.tool_calls;
		if (toolCalls && toolCalls.length > 0) {
			// Convert LLM tool calls to our format
			const toolCallRequests = toolCalls.map(tc => ({
				name: tc.function.name,
				parameters: JSON.parse(tc.function.arguments)
			}));

			const toolResults = await this.toolDispatcher.executeToolCalls(
				toolCallRequests,
				{
					db: this.db,
					userId: 'system', // System user for cron job processing
					journalId: journal.id
				}
			);

			// Check if any tool calls succeeded
			const hasSuccessfulTools = toolResults.some(result => result.result.success);
			
			if (hasSuccessfulTools) {
				// Mark journal as complete if LLM tools executed successfully
				await this.db
					.update(journalEntry)
					.set({ llmReviewStatus: 'complete' })
					.where(eq(journalEntry.id, journal.id));
			} else {
				// Mark as error if no tools succeeded
				await this.db
					.update(journalEntry)
					.set({ llmReviewStatus: 'error' })
					.where(eq(journalEntry.id, journal.id));
			}
		} else {
			// No tool calls made, but LLM responded - mark as complete
			await this.db
				.update(journalEntry)
				.set({ llmReviewStatus: 'complete' })
				.where(eq(journalEntry.id, journal.id));
		}
	}

	/**
	 * Build a prompt for journal categorization
	 */
	private buildJournalCategorizationPrompt(journal: {
		description: string | null;
		amount: number;
	}): string {
		return `Please analyze this financial transaction and provide categorization suggestions:

Transaction Details:
- Description: ${journal.description || 'Not provided'}
- Amount: $${journal.amount}

Please use the available tools to:
1. Find similar transactions using the journal_categorization tool
2. Suggest appropriate categorization based on the transaction details
3. Provide reasoning for your suggestions

Focus on accuracy and consistency with existing transaction patterns.`;
	}

	/**
	 * Reset failed journals back to 'required' status for retry
	 */
	async retryFailedJournals(options: { 
		olderThanMinutes?: number;
		batchSize?: number;
	} = {}): Promise<number> {
		const { olderThanMinutes = 60 } = options;
		
		const cutoffTime = new Date();
		cutoffTime.setMinutes(cutoffTime.getMinutes() - olderThanMinutes);

		await this.db
			.update(journalEntry)
			.set({ llmReviewStatus: 'required' })
			.where(
				and(
					eq(journalEntry.llmReviewStatus, 'error'),
					// Add condition for journals updated before cutoff time
				)
			);

		// Note: Drizzle doesn't provide rowCount, we'd need to count separately
		const affectedRows = 0; // TODO: Implement proper row counting
		
		if (affectedRows > 0) {
			logging.info(`LLM Journal Processing: Reset ${affectedRows} failed journals back to 'required' status`);
		}

		return affectedRows;
	}

	/**
	 * Get processing statistics
	 */
	async getProcessingStats(days: number = 7): Promise<{
		notRequired: number;
		required: number;
		complete: number;
		error: number;
	}> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - days);

		// This would need to be implemented with proper aggregation
		// For now, return placeholder stats
		return {
			notRequired: 0,
			required: 0,
			complete: 0,
			error: 0
		};
	}
}