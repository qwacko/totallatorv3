import {
	getAllPredefinedProviders,
	getProviderDisplayName,
	resolveApiUrl
} from './server/llm/providerConfig.js';

/**
 * Browser-safe helper surface.
 *
 * This entrypoint is intentionally small. It exists for UI code that needs
 * provider metadata without importing the main server-oriented runtime barrel.
 */
export const clientHelpers = {
	resolveApiUrl,
	getProviderDisplayName,
	getAllPredefinedProviders
};

export type { LLMProviderConfig } from './server/llm/providerConfig.js';
