// ============================================================================
// Client-side exports only - no server-side dependencies
// ============================================================================

import {
	getAllPredefinedProviders,
	getProviderDisplayName,
	resolveApiUrl
} from './server/llm/providerConfig.js';

// Export client-safe helpers
export const clientHelpers = {
	resolveApiUrl,
	getProviderDisplayName,
	getAllPredefinedProviders
};

// Export only the LLM provider config type (safe)
export type { LLMProviderConfig } from './server/llm/providerConfig.js';
