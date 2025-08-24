import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { DBType } from '@totallator/database';
import { llmSettings } from '@totallator/database';
import { llmLogs } from '@totallator/database';

import { closeTestDB, getTestDB } from '@/server/db/test/dbTest';

import { type CreateLLMSettingsType, llmActions, type UpdateLLMSettingsType } from './llmActions';

describe('llmActions', () => {
	let dbConnection: Awaited<ReturnType<typeof getTestDB>>;
	let db: DBType;

	beforeEach(async () => {
		dbConnection = await getTestDB();
		db = dbConnection.testDB;

		// Clear LLM tables before each test
		await db.delete(llmLogs);
		await db.delete(llmSettings);
	});

	afterEach(async () => {
		await closeTestDB(dbConnection);
	});

	describe('create', () => {
		it('should create LLM settings with encrypted API key', async () => {
			const data: CreateLLMSettingsType = {
				title: 'OpenAI GPT-4',
				apiUrl: 'https://api.openai.com/v1',
				apiKey: 'sk-test123456789',
				defaultModel: 'gpt-4',
				enabled: true
			};

			const result = await llmActions.create({ db, data });

			expect(result).toBeDefined();
			expect(result.id).toBeDefined();
			expect(result.title).toBe(data.title);
			expect(result.apiUrl).toBe(data.apiUrl);
			expect(result.apiKey).toBe(data.apiKey); // Should be decrypted in response
			expect(result.defaultModel).toBe(data.defaultModel);
			expect(result.enabled).toBe(true);
			expect(result.createdAt).toBeDefined();
			expect(result.updatedAt).toBeDefined();
		});

		it('should create LLM settings with default values', async () => {
			const data: CreateLLMSettingsType = {
				title: 'Claude',
				apiUrl: 'https://api.anthropic.com/v1',
				apiKey: 'sk-ant-test123'
			};

			const result = await llmActions.create({ db, data });

			expect(result.enabled).toBe(true); // default
			expect(result.defaultModel).toBeNull();
		});
	});

	describe('list', () => {
		it('should list LLM settings without API keys', async () => {
			const data1: CreateLLMSettingsType = {
				title: 'OpenAI',
				apiUrl: 'https://api.openai.com/v1',
				apiKey: 'sk-test1'
			};
			const data2: CreateLLMSettingsType = {
				title: 'Claude',
				apiUrl: 'https://api.anthropic.com/v1',
				apiKey: 'sk-test2'
			};

			await llmActions.create({ db, data: data1 });
			await llmActions.create({ db, data: data2 });

			const results = await llmActions.list({ db });

			expect(results).toHaveLength(2);
			expect(results[0]).not.toHaveProperty('apiKey');
			expect(results[1]).not.toHaveProperty('apiKey');
			expect(results.find((r) => r.title === 'OpenAI')).toBeDefined();
			expect(results.find((r) => r.title === 'Claude')).toBeDefined();
		});

		it('should return empty array when no settings exist', async () => {
			const results = await llmActions.list({ db });
			expect(results).toHaveLength(0);
		});
	});

	describe('getById', () => {
		it('should get LLM settings by ID without API key by default', async () => {
			const data: CreateLLMSettingsType = {
				title: 'Test LLM',
				apiUrl: 'https://test.com',
				apiKey: 'secret-key'
			};

			const created = await llmActions.create({ db, data });
			const result = await llmActions.getById({ db, id: created.id });

			expect(result).toBeDefined();
			expect(result!.id).toBe(created.id);
			expect(result!.title).toBe(data.title);
			expect(result).not.toHaveProperty('apiKey');
		});

		it('should get LLM settings by ID with decrypted API key when requested', async () => {
			const data: CreateLLMSettingsType = {
				title: 'Test LLM',
				apiUrl: 'https://test.com',
				apiKey: 'secret-key'
			};

			const created = await llmActions.create({ db, data });
			const result = await llmActions.getById({
				db,
				id: created.id,
				includeApiKey: true
			});

			expect(result).toBeDefined();
			expect(result!.apiKey).toBe(data.apiKey);
		});

		it('should return undefined for non-existent ID', async () => {
			const result = await llmActions.getById({ db, id: 'non-existent' });
			expect(result).toBeUndefined();
		});
	});

	describe('update', () => {
		it('should update LLM settings', async () => {
			const data: CreateLLMSettingsType = {
				title: 'Original',
				apiUrl: 'https://original.com',
				apiKey: 'original-key'
			};

			const created = await llmActions.create({ db, data });

			const updateData: UpdateLLMSettingsType = {
				title: 'Updated',
				enabled: false
			};

			const result = await llmActions.update({
				db,
				id: created.id,
				data: updateData
			});

			expect(result).toBeDefined();
			expect(result!.title).toBe('Updated');
			expect(result!.enabled).toBe(false);
			expect(result!.apiUrl).toBe(data.apiUrl); // unchanged
			expect(result!.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
		});

		it('should update API key with encryption', async () => {
			const data: CreateLLMSettingsType = {
				title: 'Test',
				apiUrl: 'https://test.com',
				apiKey: 'original-key'
			};

			const created = await llmActions.create({ db, data });

			const updateData: UpdateLLMSettingsType = {
				apiKey: 'new-secret-key'
			};

			const result = await llmActions.update({
				db,
				id: created.id,
				data: updateData
			});

			expect(result).toBeDefined();
			expect(result!.apiKey).toBe('new-secret-key');

			// Verify it's properly encrypted in database by getting with includeApiKey
			const retrieved = await llmActions.getById({
				db,
				id: created.id,
				includeApiKey: true
			});
			expect(retrieved!.apiKey).toBe('new-secret-key');
		});

		it('should return undefined for non-existent ID', async () => {
			const result = await llmActions.update({
				db,
				id: 'non-existent',
				data: { title: 'Updated' }
			});
			expect(result).toBeUndefined();
		});
	});

	describe('delete', () => {
		it('should delete LLM settings', async () => {
			const data: CreateLLMSettingsType = {
				title: 'To Delete',
				apiUrl: 'https://delete.com',
				apiKey: 'delete-key'
			};

			const created = await llmActions.create({ db, data });
			const deleteResult = await llmActions.delete({ db, id: created.id });

			expect(deleteResult).toBe(true);

			const retrieved = await llmActions.getById({ db, id: created.id });
			expect(retrieved).toBeUndefined();
		});

		it('should return false for non-existent ID', async () => {
			const result = await llmActions.delete({ db, id: 'non-existent' });
			expect(result).toBe(false);
		});
	});

	describe('getEnabled', () => {
		it('should return only enabled LLM settings with decrypted API keys', async () => {
			const data1: CreateLLMSettingsType = {
				title: 'Enabled LLM',
				apiUrl: 'https://enabled.com',
				apiKey: 'enabled-key',
				enabled: true
			};
			const data2: CreateLLMSettingsType = {
				title: 'Disabled LLM',
				apiUrl: 'https://disabled.com',
				apiKey: 'disabled-key',
				enabled: false
			};

			await llmActions.create({ db, data: data1 });
			await llmActions.create({ db, data: data2 });

			const results = await llmActions.getEnabled({ db });

			expect(results).toHaveLength(1);
			expect(results[0].title).toBe('Enabled LLM');
			expect(results[0].apiKey).toBe('enabled-key');
		});

		it('should return empty array when no enabled settings exist', async () => {
			const data: CreateLLMSettingsType = {
				title: 'Disabled',
				apiUrl: 'https://test.com',
				apiKey: 'key',
				enabled: false
			};

			await llmActions.create({ db, data });

			const results = await llmActions.getEnabled({ db });
			expect(results).toHaveLength(0);
		});
	});
});
