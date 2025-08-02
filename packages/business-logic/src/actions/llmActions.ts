import { eq } from 'drizzle-orm';
import { llmSettings, type LLMSettings } from '@totallator/database';
import { nanoid } from 'nanoid';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { encryptText, decryptText } from './helpers/encryption';
import { getContextDB, runInTransactionWithLogging } from '@totallator/context';

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

			return inserted[0];
		});

		// Return with decrypted API key for immediate use
		return {
			...result,
			apiKey: data.apiKey
		};
	},

	list: async (): Promise<Omit<LLMSettings, 'apiKey'>[]> => {
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

		return results;
	},

	getById: async ({
		id,
		includeApiKey = false
	}: {
		id: string;
		includeApiKey?: boolean;
	}): Promise<LLMSettings | undefined> => {
		const db = getContextDB();
		const results = await dbExecuteLogger(
			db.select().from(llmSettings).where(eq(llmSettings.id, id)),
			'LLM Settings - Get By ID'
		);

		if (results.length === 0) {
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

		return result;
	},

	update: async ({
		id,
		data
	}: {
		id: string;
		data: UpdateLLMSettingsType;
	}): Promise<LLMSettings | undefined> => {
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
			return undefined;
		}

		// Return with decrypted API key if it was updated
		if (data.apiKey) {
			result.apiKey = data.apiKey;
		} else if (result.apiKey) {
			result.apiKey = decryptText(result.apiKey);
		}

		return result;
	},

	delete: async ({ id }: { id: string }): Promise<boolean> => {
		const result = await runInTransactionWithLogging('Delete LLM Settings', async () => {
			const db = getContextDB();
			const deleted = await dbExecuteLogger(
				db.delete(llmSettings).where(eq(llmSettings.id, id)).returning(),
				'LLM Settings - Delete'
			);

			return deleted.length > 0;
		});

		return result;
	},

	getEnabled: async (): Promise<LLMSettings[]> => {
		const db = getContextDB();
		const results = await dbExecuteLogger(
			db.select().from(llmSettings).where(eq(llmSettings.enabled, true)),
			'LLM Settings - Get Enabled'
		);

		// Decrypt API keys for enabled settings
		return results.map((result) => ({
			...result,
			apiKey: decryptText(result.apiKey)
		}));
	}
};
