import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { getContextDB, runInTransactionWithLogging } from '@totallator/context';
import { llmLogs, llmSettings, type LLMSettings } from '@totallator/database';

import { getLogger } from '@/logger';
import { dbExecuteLogger } from '@/server/db/dbLogger';

import { decryptText, encryptText } from './helpers/encryption';

export type CreateLLMSettingsType = {
	title: string;
	apiUrl: string;
	apiKey: string;
	defaultModel?: string;
	enabled?: boolean;
};

export type UpdateLLMSettingsType = {
	title?: string;
	apiUrl?: string;
	apiKey?: string;
	defaultModel?: string;
	enabled?: boolean;
};

export const llmActions = {
	create: async ({ data }: { data: CreateLLMSettingsType }): Promise<LLMSettings> => {
		getLogger('llm').info({
			code: 'LLM_SETTINGS_001',
			title: `Creating LLM settings: ${data.title}`,
			settingTitle: data.title,
			apiUrl: data.apiUrl
		});
		const id = nanoid();
		const encryptedApiKey = encryptText(data.apiKey);

		const result = await runInTransactionWithLogging('Create LLM Settings', async () => {
			const db = getContextDB();
			const inserted = await dbExecuteLogger(
				db
					.insert(llmSettings)
					.values({
						id,
						title: data.title,
						apiUrl: data.apiUrl,
						apiKey: encryptedApiKey,
						defaultModel: data.defaultModel || null,
						enabled: data.enabled ?? true
					})
					.returning(),
				'LLM Settings - Create'
			);

			getLogger('llm').info({
				code: 'LLM_SETTINGS_002',
				title: `LLM settings created successfully: ${data.title}`,
				id,
				settingTitle: data.title
			});
			return inserted[0];
		});

		// Return with decrypted API key for immediate use
		return {
			...result,
			apiKey: data.apiKey
		};
	},

	list: async (): Promise<Omit<LLMSettings, 'apiKey'>[]> => {
		getLogger('llm').debug({
			code: 'LLM_SETTINGS_003',
			title: 'Retrieving LLM settings list'
		});
		const db = getContextDB();
		const results = await dbExecuteLogger(
			db
				.select({
					id: llmSettings.id,
					title: llmSettings.title,
					apiUrl: llmSettings.apiUrl,
					defaultModel: llmSettings.defaultModel,
					enabled: llmSettings.enabled,
					createdAt: llmSettings.createdAt,
					updatedAt: llmSettings.updatedAt
				})
				.from(llmSettings),
			'LLM Settings - List'
		);
		getLogger('llm').debug({
			code: 'LLM_SETTINGS_004',
			title: `Retrieved ${results.length} LLM settings`,
			count: results.length
		});

		return results;
	},

	getById: async ({
		id,
		includeApiKey = false
	}: {
		id: string;
		includeApiKey?: boolean;
	}): Promise<LLMSettings | undefined> => {
		getLogger('llm').debug({
			code: 'LLM_SETTINGS_005',
			title: `Retrieving LLM settings by ID: ${id}`,
			id,
			includeApiKey
		});
		const db = getContextDB();
		const results = await dbExecuteLogger(
			db.select().from(llmSettings).where(eq(llmSettings.id, id)),
			'LLM Settings - Get By ID'
		);

		if (results.length === 0) {
			getLogger('llm').warn({
				code: 'LLM_SETTINGS_006',
				title: `LLM settings not found: ${id}`,
				id
			});
			return undefined;
		}

		const result = results[0];

		if (includeApiKey) {
			// Decrypt the API key
			result.apiKey = decryptText(result.apiKey);
		} else {
			// Remove API key from response
			delete (result as any).apiKey;
		}
		getLogger('llm').debug({
			code: 'LLM_SETTINGS_007',
			title: `Retrieved LLM settings: ${result.title}`,
			id,
			settingTitle: result.title
		});

		return result;
	},

	update: async ({
		id,
		data
	}: {
		id: string;
		data: UpdateLLMSettingsType;
	}): Promise<LLMSettings | undefined> => {
		getLogger('llm').info({
			code: 'LLM_SETTINGS_008',
			title: `Updating LLM settings: ${id}`,
			id,
			updateFields: Object.keys(data)
		});
		const updateData: any = {
			...data,
			updatedAt: new Date()
		};

		// Encrypt API key if provided
		if (data.apiKey) {
			updateData.apiKey = encryptText(data.apiKey);
		}

		const result = await runInTransactionWithLogging('Update LLM Settings', async () => {
			const db = getContextDB();
			const updated = await dbExecuteLogger(
				db.update(llmSettings).set(updateData).where(eq(llmSettings.id, id)).returning(),
				'LLM Settings - Update'
			);

			return updated.length > 0 ? updated[0] : undefined;
		});

		if (!result) {
			getLogger('llm').warn({
				code: 'LLM_SETTINGS_009',
				title: `LLM settings update failed - not found: ${id}`,
				id
			});
			return undefined;
		}
		getLogger('llm').info({
			code: 'LLM_SETTINGS_010',
			title: `LLM settings updated successfully: ${result.title}`,
			id,
			settingTitle: result.title
		});

		// Return with decrypted API key if it was updated
		if (data.apiKey) {
			result.apiKey = data.apiKey;
		} else if (result.apiKey) {
			result.apiKey = decryptText(result.apiKey);
		}

		return result;
	},

	delete: async ({ id }: { id: string }): Promise<boolean> => {
		getLogger('llm').info({
			code: 'LLM_SETTINGS_011',
			title: `Deleting LLM settings: ${id}`,
			id
		});
		const result = await runInTransactionWithLogging('Delete LLM Settings', async () => {
			const db = getContextDB();

			// First delete all related LLM logs
			await dbExecuteLogger(
				db.delete(llmLogs).where(eq(llmLogs.llmSettingsId, id)),
				'LLM Logs - Delete Related'
			);

			// Then delete the LLM settings
			const deleted = await dbExecuteLogger(
				db.delete(llmSettings).where(eq(llmSettings.id, id)).returning(),
				'LLM Settings - Delete'
			);

			const success = deleted.length > 0;
			getLogger('llm').info({
				code: 'LLM_SETTINGS_012',
				title: success
					? `LLM settings deleted successfully: ${id}`
					: `LLM settings deletion failed - not found: ${id}`,
				id,
				success
			});
			return success;
		});

		return result;
	},

	getEnabled: async (): Promise<LLMSettings[]> => {
		getLogger('llm').debug({
			code: 'LLM_SETTINGS_013',
			title: 'Retrieving enabled LLM settings'
		});
		const db = getContextDB();
		const results = await dbExecuteLogger(
			db.select().from(llmSettings).where(eq(llmSettings.enabled, true)),
			'LLM Settings - Get Enabled'
		);

		// Decrypt API keys for enabled settings
		getLogger('llm').debug({
			code: 'LLM_SETTINGS_014',
			title: `Retrieved ${results.length} enabled LLM settings`,
			count: results.length,
			settings: results.map((r) => ({ id: r.id, title: r.title }))
		});
		return results.map((result) => ({
			...result,
			apiKey: decryptText(result.apiKey)
		}));
	}
};
