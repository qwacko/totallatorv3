import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
	clearTestDB,
	closeTestDB,
	getTestDB,
	initialiseTestDB,
	seedSimpleTransferJournal,
	withTestDbContext
} from '@totallator/business-logic/server/db/test/dbTest';

import { journalLlmSuggestionActions } from './journalLlmSuggestionActions';
import { llmActions } from './llmActions';
import { materializedViewActions } from './materializedViewActions';

describe('journalLlmSuggestionActions', () => {
	let testDbData: Awaited<ReturnType<typeof getTestDB>> | undefined;
	let db: Awaited<ReturnType<typeof getTestDB>>['testDB'];
	let testJournalId: string;
	let testLlmSettingsId: string;
	const runWithDb = async <T>(callback: () => Promise<T>) => await withTestDbContext(db, callback);

	beforeAll(async () => {
		testDbData = await getTestDB();
		db = testDbData.testDB;
	}, 30000);

	beforeEach(async () => {
		await runWithDb(async () => {
			await clearTestDB(db, { refreshViews: false });
			await initialiseTestDB({ db, accounts: true, refreshViews: false });

			const testJournalIds = await seedSimpleTransferJournal({
				db,
				fromAccountId: 'Account1',
				toAccountId: 'Account2',
				amount: 100,
				description: 'Test transaction for LLM suggestions',
				date: '2024-01-01'
			});
			testJournalId = testJournalIds[0];

			const createdLlmSettings = await llmActions.create({
				db,
				data: {
					title: 'Test LLM Provider',
					apiUrl: 'https://api.test.com/v1',
					apiKey: 'test-key-123',
					defaultModel: 'test-model',
					enabled: true
				}
			});
			testLlmSettingsId = createdLlmSettings.id;

			await materializedViewActions.setRefreshRequired();
		});
	}, 30000);

	afterAll(async () => {
		if (testDbData) {
			await closeTestDB(testDbData);
			testDbData = undefined;
		}
	});

	describe('create', () => {
		it('should create a new LLM suggestion', async () => {
			await runWithDb(async () => {
				const suggestionData = {
					journalId: testJournalId,
					llmSettingsId: testLlmSettingsId,
					suggestedPayee: 'Grocery Store',
					suggestedDescription: 'Groceries from local store',
					confidenceScore: 0.85,
					reasoning: 'Based on transaction amount and similar past transactions'
				};

				const result = await journalLlmSuggestionActions.create({
					db,
					data: suggestionData
				});

				expect(result).toBeDefined();
				expect(result.id).toBeDefined();
				expect(result.journalId).toBe(testJournalId);
				expect(result.suggestedPayee).toBe('Grocery Store');
				expect(result.confidenceScore).toBe(0.85);
				expect(result.status).toBe('pending');
			});
		});

		it('should supersede existing pending suggestions when creating new ones', async () => {
			await runWithDb(async () => {
				const firstSuggestion = await journalLlmSuggestionActions.create({
					db,
					data: {
						journalId: testJournalId,
						llmSettingsId: testLlmSettingsId,
						suggestedPayee: 'First Suggestion'
					}
				});

				const secondSuggestion = await journalLlmSuggestionActions.create({
					db,
					data: {
						journalId: testJournalId,
						llmSettingsId: testLlmSettingsId,
						suggestedPayee: 'Updated Suggestion'
					}
				});

				const firstUpdated = await journalLlmSuggestionActions.getById({
					db,
					id: firstSuggestion.id
				});
				expect(firstUpdated?.status).toBe('superseded');
				expect(secondSuggestion.status).toBe('pending');
			});
		});
	});

	describe('getByJournalId', () => {
		it('should retrieve suggestions for a journal', async () => {
			await runWithDb(async () => {
				await journalLlmSuggestionActions.create({
					db,
					data: {
						journalId: testJournalId,
						llmSettingsId: testLlmSettingsId,
						suggestedPayee: 'Test Payee'
					}
				});

				const suggestions = await journalLlmSuggestionActions.getByJournalId({
					db,
					journalId: testJournalId
				});

				expect(suggestions).toHaveLength(1);
				expect(suggestions[0].suggestedPayee).toBe('Test Payee');
			});
		});

		it('should only return pending suggestions by default', async () => {
			await runWithDb(async () => {
				const suggestion = await journalLlmSuggestionActions.create({
					db,
					data: {
						journalId: testJournalId,
						llmSettingsId: testLlmSettingsId,
						suggestedPayee: 'Test Payee'
					}
				});

				await journalLlmSuggestionActions.update({
					db,
					id: suggestion.id,
					data: { status: 'accepted' }
				});

				const pendingSuggestions = await journalLlmSuggestionActions.getByJournalId({
					db,
					journalId: testJournalId
				});

				const allSuggestions = await journalLlmSuggestionActions.getByJournalId({
					db,
					journalId: testJournalId,
					includeSuperseded: true
				});

				expect(pendingSuggestions).toHaveLength(0);
				expect(allSuggestions).toHaveLength(1);
			});
		});
	});

	describe('update', () => {
		it('should update suggestion status and set processedAt', async () => {
			await runWithDb(async () => {
				const suggestion = await journalLlmSuggestionActions.create({
					db,
					data: {
						journalId: testJournalId,
						llmSettingsId: testLlmSettingsId,
						suggestedPayee: 'Test Payee'
					}
				});

				const updated = await journalLlmSuggestionActions.update({
					db,
					id: suggestion.id,
					data: {
						status: 'accepted',
						processedBy: 'test-user-id'
					}
				});

				expect(updated.status).toBe('accepted');
				expect(updated.processedBy).toBe('test-user-id');
				expect(updated.processedAt).toBeDefined();
			});
		});
	});

	describe('getPendingByJournalIds', () => {
		it('should return pending suggestions for multiple journals', async () => {
			await runWithDb(async () => {
				const testJournal2Ids = await seedSimpleTransferJournal({
					db,
					fromAccountId: 'Account3',
					toAccountId: 'Account4',
					amount: 200,
					description: 'Second test transaction',
					date: '2024-01-01'
				});

				await journalLlmSuggestionActions.create({
					db,
					data: {
						journalId: testJournalId,
						llmSettingsId: testLlmSettingsId,
						suggestedPayee: 'Payee 1'
					}
				});

				await journalLlmSuggestionActions.create({
					db,
					data: {
						journalId: testJournal2Ids[0],
						llmSettingsId: testLlmSettingsId,
						suggestedPayee: 'Payee 2'
					}
				});

				const suggestions = await journalLlmSuggestionActions.getPendingByJournalIds({
					db,
					journalIds: [testJournalId, testJournal2Ids[0]]
				});

				expect(suggestions).toHaveLength(2);
			});
		});
	});

	describe('delete', () => {
		it('should delete a suggestion', async () => {
			await runWithDb(async () => {
				const suggestion = await journalLlmSuggestionActions.create({
					db,
					data: {
						journalId: testJournalId,
						llmSettingsId: testLlmSettingsId,
						suggestedPayee: 'Test Payee'
					}
				});

				await journalLlmSuggestionActions.delete({
					db,
					id: suggestion.id
				});

				const deleted = await journalLlmSuggestionActions.getById({
					db,
					id: suggestion.id
				});

				expect(deleted).toBeNull();
			});
		});
	});
});
