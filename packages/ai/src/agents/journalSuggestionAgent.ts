import { eq } from 'drizzle-orm';
import type { LanguageModel } from 'ai';

import { tActions } from '@totallator/business-logic';
import { getContextDB } from '@totallator/context';
import { llmSettings } from '@totallator/database';

import { createLanguageModelForSelection } from '../config/createLanguageModel';
import { buildInitialJournalContext } from '../context/buildInitialJournalContext';
import { resolveTaskModelSelection } from '../config/modelResolver';
import { AI_TASK_IDS } from '../tasks/taskIds';
import { buildBuildInitialContextTool } from '../tools/context/buildInitialContext';
import { buildExpandImportSimilarityTool } from '../tools/context/expandImportSimilarity';
import { buildExpandJournalSimilarityTool } from '../tools/context/expandJournalSimilarity';
import { buildGetJournalsContextTool } from '../tools/context/getJournalsContext';
import { buildSearchEntitiesTool } from '../tools/entity/searchEntities';
import { createJournalSuggestionToolLoopAgent } from './createJournalSuggestionToolLoopAgent';
import { journalSuggestionResultSchema, type JournalSuggestionResult } from './journalSuggestionSchema';

const buildJournalPrompt = ({
	journalId,
	initialContext
}: {
	journalId: string;
	initialContext: unknown;
}) =>
	[
		`Generate a journal update suggestion for journal ${journalId}.`,
		'Use the provided initial context first, then call the deeper tools only when you need more evidence.',
		'The initial context is substantial and already includes transaction context plus preload evidence.',
		`Initial context:\n${JSON.stringify(initialContext, null, 2)}`,
		'Return a structured result for this exact journal ID.'
	].join('\n');

export const runJournalRecommendationAgent = async ({
	journalIds,
	llmSettingsId,
	triggerSource = 'manual-bulk',
	initiatedByUserId,
	languageModel,
	overrideModel
}: {
	journalIds: string[];
	llmSettingsId: string;
	triggerSource?: string;
	initiatedByUserId?: string;
	languageModel?: LanguageModel;
	overrideModel?: string;
}) => {
	const db = getContextDB();
	const settingsRow = await db.query.llmSettings.findFirst({
		where: eq(llmSettings.id, llmSettingsId)
	});

	if (!settingsRow) {
		throw new Error(`LLM settings not found: ${llmSettingsId}`);
	}

	const selection = resolveTaskModelSelection({
		taskId: AI_TASK_IDS.JOURNAL_RECOMMENDATION,
		llmSettings: settingsRow,
		overrideModel
	});

	const run = await tActions.agentRun.create({
		taskId: AI_TASK_IDS.JOURNAL_RECOMMENDATION,
		triggerSource,
		llmSettingsId,
		initiatedByUserId,
		targetJournalCount: journalIds.length
	});

	await tActions.agentRun.markRunning({
		id: run.id,
		model: selection.model,
		provider: selection.providerId,
		promptVersion: 'v2-tool-loop-agent'
	});

	await tActions.agentRun.appendEvent({
		type: 'agent_run.started',
		agentRunId: run.id,
		taskId: AI_TASK_IDS.JOURNAL_RECOMMENDATION,
		summary: `Starting journal recommendation run for ${journalIds.length} journals`
	});

	const tools = {
		build_initial_context: buildBuildInitialContextTool(db),
		get_journals_context: buildGetJournalsContextTool(db),
		expand_import_similarity: buildExpandImportSimilarityTool(db),
		expand_journal_similarity: buildExpandJournalSimilarityTool(db),
		search_entities: buildSearchEntitiesTool(db)
	};

	const model =
		languageModel ??
		createLanguageModelForSelection({
			selection,
			apiKey:
				(
					await tActions.llm.getById({
						id: llmSettingsId,
						includeApiKey: true
					})
				)?.apiKey ??
				(() => {
					throw new Error(`LLM API key not found for settings: ${llmSettingsId}`);
				})()
		});

	const persistedSuggestions: JournalSuggestionResult[] = [];
	let failureCount = 0;

	for (const journalId of journalIds) {
		await tActions.agentRun.appendEvent({
			type: 'agent_run.step_started',
			agentRunId: run.id,
			taskId: AI_TASK_IDS.JOURNAL_RECOMMENDATION,
			journalId,
			summary: 'Starting journal recommendation'
		});

		let stepIndex = 0;

		try {
			// The first prompt gets a substantial preload on purpose. The deeper tools
			// expand specific evidence branches rather than reconstructing the basics.
			const initialContext = await buildInitialJournalContext({
				db,
				journalIds: [journalId]
			});

			const agent = createJournalSuggestionToolLoopAgent({
				model,
				tools,
				maxSteps: selection.maxSteps
			});

			const result = await agent.generate({
				prompt: buildJournalPrompt({
					journalId,
					initialContext
				}),
				onStepFinish: async (stepResult) => {
					const currentStepIndex = stepIndex++;

					await tActions.agentRun.appendEvent({
						type: 'agent_run.model_response',
						agentRunId: run.id,
						taskId: AI_TASK_IDS.JOURNAL_RECOMMENDATION,
						journalId,
						stepIndex: currentStepIndex,
						summary: `Model step finished with ${stepResult.finishReason}`,
						data: {
							finishReason: stepResult.finishReason,
							text: stepResult.text || null,
							usage: stepResult.usage
						}
					});

					for (const toolCall of stepResult.toolCalls) {
						await tActions.agentRun.appendEvent({
							type: 'agent_run.tool_called',
							agentRunId: run.id,
							taskId: AI_TASK_IDS.JOURNAL_RECOMMENDATION,
							journalId,
							stepIndex: currentStepIndex,
							summary: `Tool called: ${toolCall.toolName}`,
							data: {
								toolCallId: toolCall.toolCallId,
								toolName: toolCall.toolName,
								input: toolCall.input
							}
						});
					}

					for (const toolResult of stepResult.toolResults) {
						await tActions.agentRun.appendEvent({
							type: 'agent_run.tool_completed',
							agentRunId: run.id,
							taskId: AI_TASK_IDS.JOURNAL_RECOMMENDATION,
							journalId,
							stepIndex: currentStepIndex,
							summary: `Tool completed: ${toolResult.toolName}`,
							data: {
								toolCallId: toolResult.toolCallId,
								toolName: toolResult.toolName,
								input: toolResult.input,
								output: toolResult.output
							}
						});
					}
				}
			});

			const parsed = journalSuggestionResultSchema.parse(result.output);

			await tActions.journalLlmSuggestion.create({
				data: {
					id: `${run.id}:${journalId}`,
					journalId,
					llmSettingsId,
					agentRunId: run.id,
					confidenceScore: parsed.confidence,
					reasoning: parsed.reasons.join('\n'),
					suggestedDescription: parsed.proposedUpdate.description,
					suggestedAccountId: parsed.proposedUpdate.accountId,
					suggestedCategoryId: parsed.proposedUpdate.categoryId,
					suggestedBillId: parsed.proposedUpdate.billId,
					suggestedBudgetId: parsed.proposedUpdate.budgetId,
					suggestedTagId: parsed.proposedUpdate.tagId,
					suggestionPayload: parsed,
					status: parsed.status === 'suggested' ? 'pending' : 'superseded'
				}
			});

			persistedSuggestions.push(parsed);

			await tActions.agentRun.appendEvent({
				type: 'agent_run.journal_completed',
				agentRunId: run.id,
				taskId: AI_TASK_IDS.JOURNAL_RECOMMENDATION,
				journalId,
				summary: parsed.summary,
				data: {
					status: parsed.status,
					confidence: parsed.confidence
				}
			});
		} catch (error) {
			failureCount += 1;

			await tActions.agentRun.appendEvent({
				type: 'agent_run.failed',
				agentRunId: run.id,
				taskId: AI_TASK_IDS.JOURNAL_RECOMMENDATION,
				journalId,
				summary: error instanceof Error ? error.message : String(error),
				data: error instanceof Error ? { stack: error.stack } : undefined
			});
		}
	}

	if (persistedSuggestions.length === 0 && failureCount > 0) {
		await tActions.agentRun.markFailed({
			id: run.id,
			summary: `Recommendation run failed for all ${failureCount} journal(s)`
		});

		await tActions.agentRun.appendEvent({
			type: 'agent_run.failed',
			agentRunId: run.id,
			taskId: AI_TASK_IDS.JOURNAL_RECOMMENDATION,
			summary: `Recommendation run failed for all ${failureCount} journal(s)`,
			data: {
				processedJournalCount: 0,
				failureCount
			}
		});
	} else {
		await tActions.agentRun.markCompleted({
			id: run.id,
			processedJournalCount: persistedSuggestions.length,
			failureCount,
			summary: `Completed recommendation run with ${persistedSuggestions.length} suggestion(s)`
		});

		await tActions.agentRun.appendEvent({
			type: 'agent_run.completed',
			agentRunId: run.id,
			taskId: AI_TASK_IDS.JOURNAL_RECOMMENDATION,
			summary: `Completed recommendation run with ${persistedSuggestions.length} suggestion(s)`,
			data: {
				processedJournalCount: persistedSuggestions.length,
				failureCount
			}
		});
	}

	return {
		agentRunId: run.id,
		suggestions: persistedSuggestions,
		failureCount
	};
};
