import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { clearTestDB, closeTestDB, getTestDB, initialiseTestDB } from '@/server/db/test/dbTest';

import { journalActions } from './journalActions';
import { journalLlmSuggestionActions } from './journalLlmSuggestionActions';
import { llmActions } from './llmActions';
import { materializedViewActions } from './materializedViewActions';

describe('journalLlmSuggestionActions', () => {
	let testDbData: Awaited<ReturnType<typeof getTestDB>> | undefined;
	let db: Awaited<ReturnType<typeof getTestDB>>['testDB'];
	let testJournalId: string;
	let testLlmSettingsId: string;

	beforeEach(async () => {
		testDbData = await getTestDB();
		db = testDbData.testDB;

		// Clear and initialize test DB
		await clearTestDB(db);
		await initialiseTestDB({ db, accounts: true, id: 'test' });

		// Create test journal entry using existing accounts
		const testJournalIds = await journalActions.createFromSimpleTransaction({
			db,
			transaction: {
				fromAccountId: 'Account1', // From initialiseTestDB
				toAccountId: 'Account2', // From initialiseTestDB
				amount: 100,
				description: 'Test transaction for LLM suggestions',
				date: '2024-01-01',
				importId: undefined,
				importDetailId: undefined,
				tagId: undefined,
				billId: undefined,
				budgetId: undefined,
				categoryId: undefined,
				billTitle: undefined,
				budgetTitle: undefined,
				categoryTitle: undefined,
				tagTitle: undefined,
				fromAccountTitle: undefined,
				toAccountTitle: undefined
			}
		});
		testJournalId = testJournalIds[0];

		// Create test LLM settings
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

		// Refresh materialized views
		await materializedViewActions.setRefreshRequired();
	});

	afterAll(async () => {
		if (testDbData) {
			await closeTestDB(testDbData);
			testDbData = undefined;
		}
	});

	describe('create', () => {
		it('should create a new LLM suggestion', async () => {
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

		it('should supersede existing pending suggestions when creating new ones', async () => {
			// Create first suggestion
			const firstSuggestion = await journalLlmSuggestionActions.create({
				db,
				data: {
					journalId: testJournalId,
					llmSettingsId: testLlmSettingsId,
					suggestedPayee: 'First Suggestion'
				}
			});

			// Create second suggestion (should supersede first)
			const secondSuggestion = await journalLlmSuggestionActions.create({
				db,
				data: {
					journalId: testJournalId,
					llmSettingsId: testLlmSettingsId,
					suggestedPayee: 'Updated Suggestion'
				}
			});

			// Check that first suggestion is superseded
			const firstUpdated = await journalLlmSuggestionActions.getById({
				db,
				id: firstSuggestion.id
			});
			expect(firstUpdated?.status).toBe('superseded');

			// Check that second suggestion is pending
			expect(secondSuggestion.status).toBe('pending');
		});
	});

	describe('getByJournalId', () => {
		it('should retrieve suggestions for a journal', async () => {
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

		it('should only return pending suggestions by default', async () => {
			const suggestion = await journalLlmSuggestionActions.create({
				db,
				data: {
					journalId: testJournalId,
					llmSettingsId: testLlmSettingsId,
					suggestedPayee: 'Test Payee'
				}
			});

			// Mark as accepted
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

	describe('update', () => {
		it('should update suggestion status and set processedAt', async () => {
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

	describe('getPendingByJournalIds', () => {
		it('should return pending suggestions for multiple journals', async () => {
			// Create another test journal using existing accounts
			const testJournal2Ids = await journalActions.createFromSimpleTransaction({
				db,
				transaction: {
					fromAccountId: 'Account3', // From initialiseTestDB
					toAccountId: 'Account4', // From initialiseTestDB
					amount: 200,
					description: 'Second test transaction',
					date: '2024-01-01',
					importId: undefined,
					importDetailId: undefined,
					tagId: undefined,
					billId: undefined,
					budgetId: undefined,
					categoryId: undefined,
					billTitle: undefined,
					budgetTitle: undefined,
					categoryTitle: undefined,
					tagTitle: undefined,
					fromAccountTitle: undefined,
					toAccountTitle: undefined
				}
			});
			const testJournal2Id = testJournal2Ids[0];

			// Create suggestions for both journals
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
					journalId: testJournal2Id,
					llmSettingsId: testLlmSettingsId,
					suggestedPayee: 'Payee 2'
				}
			});

			const suggestions = await journalLlmSuggestionActions.getPendingByJournalIds({
				db,
				journalIds: [testJournalId, testJournal2Id]
			});

			expect(suggestions).toHaveLength(2);
		});
	});

	describe('delete', () => {
		it('should delete a suggestion', async () => {
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
