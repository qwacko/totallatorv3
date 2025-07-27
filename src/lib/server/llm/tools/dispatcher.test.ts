import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getTestDB, closeTestDB } from '../../db/test/dbTest';
import { ToolDispatcher } from './dispatcher';
import type { ToolExecutionContext } from './types';
import type { DBType } from '../../db/db';
import { journalEntry, account, transaction } from '../../db/postgres/schema/transactionSchema';
import { nanoid } from 'nanoid';

describe('ToolDispatcher', () => {
	let dbConnection: Awaited<ReturnType<typeof getTestDB>>;
	let db: DBType;
	let dispatcher: ToolDispatcher;
	let context: ToolExecutionContext;

	beforeEach(async () => {
		dbConnection = await getTestDB();
		db = dbConnection.testDB;
		dispatcher = new ToolDispatcher();
		context = { db, userId: 'test-user' };

		// Clear existing data
		await db.delete(journalEntry);
		await db.delete(account);
	});

	afterEach(async () => {
		await closeTestDB(dbConnection);
	});

	describe('Tool Registration', () => {
		it('should register all expected tools', () => {
			const toolNames = dispatcher.getToolNames();
			expect(toolNames).toContain('findSimilarJournalEntries');
			expect(toolNames).toContain('getInvoiceText');
			expect(toolNames).toContain('updateJournalEntry');
		});

		it('should provide tool definitions in LLM format', () => {
			const definitions = dispatcher.getToolDefinitions();
			expect(definitions).toHaveLength(3);

			const findSimilarTool = definitions.find(
				(d) => d.function.name === 'findSimilarJournalEntries'
			);
			expect(findSimilarTool).toBeDefined();
			expect(findSimilarTool!.type).toBe('function');
			expect(findSimilarTool!.function.description).toContain('Find journal entries');
			expect(findSimilarTool!.function.parameters.type).toBe('object');
			expect(findSimilarTool!.function.parameters.properties).toBeDefined();
		});
	});

	describe('Parameter Validation', () => {
		it('should reject unknown tools', async () => {
			const response = await dispatcher.executeToolCall(
				{ name: 'unknownTool', parameters: {} },
				context
			);

			expect(response.result.success).toBe(false);
			expect(response.result.error).toContain('not found');
		});

		it('should validate parameter types', async () => {
			const response = await dispatcher.executeToolCall(
				{
					name: 'findSimilarJournalEntries',
					parameters: { amount: 'not-a-number' }
				},
				context
			);

			expect(response.result.success).toBe(false);
			expect(response.result.error).toContain('must be a number');
		});

		it('should validate required parameters for updateJournalEntry', async () => {
			const response = await dispatcher.executeToolCall(
				{ name: 'updateJournalEntry', parameters: {} },
				context
			);

			expect(response.result.success).toBe(false);
			expect(response.result.error).toContain('Missing required parameter');
		});
	});

	describe('findSimilarJournalEntries Tool', () => {
		beforeEach(async () => {
			// Create some test journal entries
			const accountId = nanoid();
			await db.insert(account).values({
				id: accountId,
				title: 'Test Account',
				type: 'asset',
				accountGroup: 'Asset',
				accountGroup2: 'Current',
				accountGroup3: 'Cash',
				accountGroupCombined: 'Asset.Current.Cash',
				accountTitleCombined: 'Asset.Current.Cash.Test Account',
				createdAt: new Date(),
				updatedAt: new Date()
			});

			// Create transactions for the journal entries
			const txn1 = nanoid();
			const txn2 = nanoid();
			const txn3 = nanoid();

			await db.insert(transaction).values([
				{ id: txn1, createdAt: new Date(), updatedAt: new Date() },
				{ id: txn2, createdAt: new Date(), updatedAt: new Date() },
				{ id: txn3, createdAt: new Date(), updatedAt: new Date() }
			]);

			await db.insert(journalEntry).values([
				{
					id: nanoid(),
					amount: 50.0,
					description: 'Coffee purchase',
					date: new Date('2024-01-15'),
					dateText: '2024-01-15',
					accountId,
					transactionId: txn1,
					complete: true,
					yearMonthDay: '2024-01-15',
					yearWeek: '2024-W03',
					yearMonth: '2024-01',
					yearQuarter: '2024-Q1',
					year: '2024',
					createdAt: new Date(),
					updatedAt: new Date()
				},
				{
					id: nanoid(),
					amount: 45.5,
					description: 'Coffee and pastry',
					date: new Date('2024-01-16'),
					dateText: '2024-01-16',
					accountId,
					transactionId: txn2,
					complete: true,
					yearMonthDay: '2024-01-16',
					yearWeek: '2024-W03',
					yearMonth: '2024-01',
					yearQuarter: '2024-Q1',
					year: '2024',
					createdAt: new Date(),
					updatedAt: new Date()
				},
				{
					id: nanoid(),
					amount: 1000.0,
					description: 'Rent payment',
					date: new Date('2024-01-01'),
					dateText: '2024-01-01',
					accountId,
					transactionId: txn3,
					complete: true,
					yearMonthDay: '2024-01-01',
					yearWeek: '2024-W01',
					yearMonth: '2024-01',
					yearQuarter: '2024-Q1',
					year: '2024',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			]);
		});

		it('should find entries by description', async () => {
			const response = await dispatcher.executeToolCall(
				{
					name: 'findSimilarJournalEntries',
					parameters: { description: 'coffee' }
				},
				context
			);

			expect(response.result.success).toBe(true);
			expect(response.result.data.entries).toHaveLength(2);
			expect(response.result.data.entries[0].description).toContain('Coffee');
		});

		it('should find entries by payee', async () => {
			const response = await dispatcher.executeToolCall(
				{
					name: 'findSimilarJournalEntries',
					parameters: { payee: 'coffee' }
				},
				context
			);

			expect(response.result.success).toBe(true);
			expect(response.result.data.entries).toHaveLength(2);
		});

		it('should find entries by amount with tolerance', async () => {
			const response = await dispatcher.executeToolCall(
				{
					name: 'findSimilarJournalEntries',
					parameters: { amount: 48 }
				},
				context
			);

			expect(response.result.success).toBe(true);
			// Should find both coffee entries (45.50 and 50.00) as they're within 10% of 48
			expect(response.result.data.entries).toHaveLength(2);
		});

		it('should return empty result with no criteria', async () => {
			const response = await dispatcher.executeToolCall(
				{ name: 'findSimilarJournalEntries', parameters: {} },
				context
			);

			expect(response.result.success).toBe(true);
			expect(response.result.data.entries).toHaveLength(0);
			expect(response.result.data.message).toContain('No search criteria');
		});
	});

	describe('getInvoiceText Tool', () => {
		it('should require file_id or journal_id', async () => {
			const response = await dispatcher.executeToolCall(
				{ name: 'getInvoiceText', parameters: {} },
				context
			);

			expect(response.result.success).toBe(false);
			expect(response.result.error).toContain('file_id or journal_id must be provided');
		});

		it('should handle non-existent file_id', async () => {
			const response = await dispatcher.executeToolCall(
				{
					name: 'getInvoiceText',
					parameters: { file_id: 'non-existent' }
				},
				context
			);

			expect(response.result.success).toBe(false);
			expect(response.result.error).toContain('No file found');
		});
	});

	describe('updateJournalEntry Tool', () => {
		let testJournalId: string;

		beforeEach(async () => {
			// Create a test journal entry
			const accountId = nanoid();
			await db.insert(account).values({
				id: accountId,
				title: 'Test Account',
				type: 'asset',
				accountGroup: 'Asset',
				accountGroup2: 'Current',
				accountGroup3: 'Cash',
				accountGroupCombined: 'Asset.Current.Cash',
				accountTitleCombined: 'Asset.Current.Cash.Test Account',
				createdAt: new Date(),
				updatedAt: new Date()
			});

			testJournalId = nanoid();
			const transactionId = nanoid();

			// First create a transaction
			await db.insert(transaction).values({
				id: transactionId,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			await db.insert(journalEntry).values({
				id: testJournalId,
				amount: 100.0,
				description: 'Original description',
				date: new Date('2024-01-15'),
				dateText: '2024-01-15',
				accountId,
				transactionId,
				complete: false,
				yearMonthDay: '2024-01-15',
				yearWeek: '2024-W03',
				yearMonth: '2024-01',
				yearQuarter: '2024-Q1',
				year: '2024',
				createdAt: new Date(),
				updatedAt: new Date()
			});
		});

		it('should update journal entry fields', async () => {
			const response = await dispatcher.executeToolCall(
				{
					name: 'updateJournalEntry',
					parameters: {
						journal_id: testJournalId,
						updates: {
							payee: 'Updated payee',
							description: 'Updated description',
							complete: true
						}
					}
				},
				context
			);

			expect(response.result.success).toBe(true);
			expect(response.result.data.changes_made).toHaveLength(3);
			expect(response.result.data.updated_entry.payee).toBe('Updated payee');
			expect(response.result.data.updated_entry.description).toBe('Updated description');
			expect(response.result.data.updated_entry.complete).toBe(true);
		});

		it('should reject invalid update fields', async () => {
			const response = await dispatcher.executeToolCall(
				{
					name: 'updateJournalEntry',
					parameters: {
						journal_id: testJournalId,
						updates: {
							invalidField: 'value',
							amount: 999 // amount updates not allowed via this tool
						}
					}
				},
				context
			);

			expect(response.result.success).toBe(false);
			expect(response.result.error).toContain('No valid update fields');
		});

		it('should handle non-existent journal entry', async () => {
			const response = await dispatcher.executeToolCall(
				{
					name: 'updateJournalEntry',
					parameters: {
						journal_id: 'non-existent',
						updates: { payee: 'New payee' }
					}
				},
				context
			);

			expect(response.result.success).toBe(false);
			expect(response.result.error).toContain('not found');
		});
	});

	describe('Multiple Tool Execution', () => {
		it('should execute multiple tools in parallel', async () => {
			const responses = await dispatcher.executeToolCalls(
				[
					{ name: 'findSimilarJournalEntries', parameters: {} },
					{ name: 'getInvoiceText', parameters: { file_id: 'test' } }
				],
				context
			);

			expect(responses).toHaveLength(2);
			expect(responses[0].name).toBe('findSimilarJournalEntries');
			expect(responses[1].name).toBe('getInvoiceText');
		});
	});
});
