import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { MockLanguageModelV3, mockValues } from 'ai/test';
import {
	clearTestDB,
	closeTestDB,
	getTestDB,
	initialiseTestDB,
	testImportSeedIds,
	withTestDbContext
} from '@totallator/business-logic/testing';
import type { DBType } from '@totallator/database';
import {
	agentRun,
	agentRunEvent,
	journalEntry,
	journalLlmSuggestions,
	llmSettings
} from '@totallator/database';
import { and, eq } from 'drizzle-orm';

import { runJournalRecommendationAgent } from './journalSuggestionAgent';

const buildUsage = () => ({
	inputTokens: {
		total: 10,
		noCache: 10,
		cacheRead: undefined,
		cacheWrite: undefined
	},
	outputTokens: {
		total: 20,
		text: 20,
		reasoning: undefined
	}
});

describe('runJournalRecommendationAgent', () => {
	let dbConnection: Awaited<ReturnType<typeof getTestDB>>;
	let db: DBType;

	beforeAll(async () => {
		dbConnection = await getTestDB();
		db = dbConnection.testDB;
	}, 30000);

	beforeEach(async () => {
		await withTestDbContext(db, async () => {
			await clearTestDB(db, { refreshViews: false });
			await initialiseTestDB({
				db,
				accounts: true,
				bills: true,
				budgets: true,
				categories: true,
				labels: true,
				tags: true,
				transactions: true,
				refreshViews: false
			});

			await db.insert(llmSettings).values({
				id: 'llm-test',
				title: 'Test',
				apiUrl: 'openai',
				apiKey: 'encrypted',
				defaultModel: 'gpt-4o-mini',
				enabled: true
			});
		});
	}, 30000);

	afterAll(async () => {
		await closeTestDB(dbConnection);
	});

	it('uses the new tool surface, persists the suggestion, and records step events', async () => {
		await withTestDbContext(db, async () => {
			const groceryJournal = await db.query.journalEntry.findFirst({
				where: and(
					eq(journalEntry.importDetailId, testImportSeedIds.transaction.importDetail2Id),
					eq(journalEntry.amount, -89.45)
				)
			});

			const languageModel = new MockLanguageModelV3({
				doGenerate: mockValues(
					{
						content: [
							{
								type: 'tool-call' as const,
								toolCallId: 'call-1',
								toolName: 'build_initial_context',
								input: JSON.stringify({
									journalIds: [groceryJournal!.id],
									evidenceLimitPerJournal: 6
								})
							}
						],
						finishReason: { unified: 'tool-calls' as const, raw: undefined },
						usage: buildUsage(),
						warnings: []
					},
					{
						content: [
							{
								type: 'text' as const,
								text: JSON.stringify({
									journalId: groceryJournal!.id,
									status: 'suggested',
									confidence: 0.9,
									summary: 'Suggest groceries category from import history',
									reasons: ['Matching import history points to groceries'],
									proposedUpdate: {
										categoryId: 'Category3',
										setDataChecked: true
									},
									warnings: []
								})
							}
						],
						finishReason: { unified: 'stop' as const, raw: undefined },
						usage: buildUsage(),
						warnings: []
					}
				)
			});

			const result = await runJournalRecommendationAgent({
				journalIds: [groceryJournal!.id],
				llmSettingsId: 'llm-test',
				triggerSource: 'manual-single',
				languageModel
			});

			expect(result.agentRunId).toBeDefined();
			expect(result.suggestions).toHaveLength(1);
			expect(result.suggestions[0].status).toBe('suggested');
			expect(result.suggestions[0].proposedUpdate.categoryId).toBe('Category3');

			const suggestionRows = await db
				.select()
				.from(journalLlmSuggestions)
				.where(eq(journalLlmSuggestions.agentRunId, result.agentRunId));
			expect(suggestionRows).toHaveLength(1);

			const events = await db
				.select()
				.from(agentRunEvent)
				.where(eq(agentRunEvent.agentRunId, result.agentRunId));
			expect(events.some((event) => event.type === 'agent_run.tool_called')).toBe(true);
			expect(events.some((event) => event.type === 'agent_run.tool_completed')).toBe(true);
			expect(events.some((event) => event.type === 'agent_run.model_response')).toBe(true);

			expect(languageModel.doGenerateCalls).toHaveLength(2);
		});
	});

	it('marks the run failed when all journals fail', async () => {
		await withTestDbContext(db, async () => {
			const groceryJournal = await db.query.journalEntry.findFirst({
				where: and(
					eq(journalEntry.importDetailId, testImportSeedIds.transaction.importDetail2Id),
					eq(journalEntry.amount, -89.45)
				)
			});

			const languageModel = new MockLanguageModelV3({
				doGenerate: mockValues({
					content: [
						{
							type: 'text' as const,
							text: '{"not":"valid-journal-suggestion"}'
						}
					],
					finishReason: { unified: 'stop' as const, raw: undefined },
					usage: buildUsage(),
					warnings: []
				})
			});

			const result = await runJournalRecommendationAgent({
				journalIds: [groceryJournal!.id],
				llmSettingsId: 'llm-test',
				triggerSource: 'manual-single',
				languageModel
			});

			expect(result.suggestions).toHaveLength(0);

			const runRow = await db.query.agentRun.findFirst({
				where: eq(agentRun.id, result.agentRunId)
			});
			expect(runRow?.status).toBe('failed');

			const events = await db
				.select()
				.from(agentRunEvent)
				.where(eq(agentRunEvent.agentRunId, result.agentRunId));
			expect(events.some((event) => event.type === 'agent_run.failed')).toBe(true);

			const suggestionRows = await db
				.select()
				.from(journalLlmSuggestions)
				.where(eq(journalLlmSuggestions.agentRunId, result.agentRunId));
			expect(suggestionRows).toHaveLength(0);
		});
	});
});
