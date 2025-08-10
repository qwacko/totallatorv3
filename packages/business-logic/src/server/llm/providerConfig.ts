// ============================================================================
// LLM Provider Configuration (Isomorphic - works on both client and server)
// ============================================================================

export interface LLMProviderConfig {
	id: string;
	name: string;
	apiUrl: string;
	description: string;
	requiresCustomModel?: boolean;
	defaultModels: string[];
	iconName?: string;
	documentationUrl?: string;
}

/**
 * Supported AI SDK providers - only officially supported providers
 */
export const PREDEFINED_PROVIDERS: Record<string, LLMProviderConfig> = {
	openai: {
		id: 'openai',
		name: 'OpenAI',
		apiUrl: 'https://api.openai.com/v1',
		description: 'Official OpenAI API (GPT-4, GPT-3.5-turbo, etc.)',
		defaultModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
		iconName: 'openai',
		documentationUrl: 'https://platform.openai.com/docs'
	},

	anthropic: {
		id: 'anthropic',
		name: 'Anthropic',
		apiUrl: 'https://api.anthropic.com',
		description: 'Official Anthropic API (Claude models)',
		defaultModels: [
			'claude-3-5-sonnet-20241022',
			'claude-3-5-haiku-20241022',
			'claude-3-opus-20240229',
			'claude-3-sonnet-20240229',
			'claude-3-haiku-20240307'
		],
		iconName: 'anthropic',
		documentationUrl: 'https://docs.anthropic.com'
	},

	google: {
		id: 'google',
		name: 'Google AI (Gemini)',
		apiUrl: 'https://generativelanguage.googleapis.com/v1beta',
		description: 'Google AI API (Gemini models)',
		defaultModels: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
		iconName: 'google',
		documentationUrl: 'https://ai.google.dev/docs'
	},

	xai: {
		id: 'xai',
		name: 'xAI (Grok)',
		apiUrl: 'https://api.x.ai/v1',
		description: 'xAI API (Grok models)',
		defaultModels: ['grok-beta', 'grok-vision-beta'],
		iconName: 'x',
		documentationUrl: 'https://docs.x.ai'
	},

	groq: {
		id: 'groq',
		name: 'Groq',
		apiUrl: 'https://api.groq.com/openai/v1',
		description: 'Groq - Ultra-fast inference',
		defaultModels: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
		iconName: 'zap',
		documentationUrl: 'https://console.groq.com/docs'
	},

	openrouter: {
		id: 'openrouter',
		name: 'OpenRouter',
		apiUrl: 'https://openrouter.ai/api/v1',
		description: 'OpenRouter - Access to hundreds of models',
		requiresCustomModel: true,
		defaultModels: [
			'anthropic/claude-3.5-sonnet',
			'openai/gpt-4o',
			'google/gemini-2.0-flash-001',
			'meta-llama/llama-3.1-405b-instruct',
			'microsoft/wizardlm-2-8x22b'
		],
		iconName: 'globe',
		documentationUrl: 'https://openrouter.ai/docs'
	}
};

/**
 * Check if a provider ID is predefined
 */
export function isPredefinedProvider(providerIdOrUrl: string): boolean {
	return providerIdOrUrl in PREDEFINED_PROVIDERS;
}

/**
 * Get provider configuration by ID or return null if custom
 */
export function getProviderConfig(providerIdOrUrl: string): LLMProviderConfig | null {
	return PREDEFINED_PROVIDERS[providerIdOrUrl] || null;
}

/**
 * Resolve the actual API URL from provider ID or custom URL
 */
export function resolveApiUrl(providerIdOrUrl: string): string {
	const config = getProviderConfig(providerIdOrUrl);
	return config ? config.apiUrl : providerIdOrUrl;
}

/**
 * Get a friendly display name for the provider
 */
export function getProviderDisplayName(providerIdOrUrl: string): string {
	const config = getProviderConfig(providerIdOrUrl);
	if (config) {
		return config.name;
	}

	// For custom URLs, try to extract a friendly name from the domain
	try {
		const url = new URL(providerIdOrUrl);
		const hostname = url.hostname;

		// Extract the main domain name (remove 'api.' prefix and '.com' suffix)
		const parts = hostname.split('.');
		if (parts[0] === 'api' && parts.length > 1) {
			return parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
		}
		return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
	} catch {
		// If it's not a valid URL, just return the string as-is
		return providerIdOrUrl;
	}
}

/**
 * Get the provider type for AI SDK routing
 */
export function getProviderType(
	providerId: string
): 'openai' | 'anthropic' | 'google' | 'xai' | 'groq' | 'openrouter' {
	const config = getProviderConfig(providerId);

	if (config) {
		switch (config.id) {
			case 'anthropic':
				return 'anthropic';
			case 'google':
				return 'google';
			case 'xai':
				return 'xai';
			case 'groq':
				return 'groq';
			case 'openrouter':
				return 'openrouter';
			case 'openai':
			default:
				return 'openai';
		}
	}

	// If not found, default to OpenAI
	return 'openai';
}

/**
 * Get list of all predefined providers for UI dropdowns
 */
export function getAllPredefinedProviders(): LLMProviderConfig[] {
	return Object.values(PREDEFINED_PROVIDERS);
}

/**
 * Validate provider selection - all providers are now predefined
 */
export function validateProviderSelection(providerId: string): { valid: boolean; error?: string } {
	if (isPredefinedProvider(providerId)) {
		return { valid: true };
	}

	return {
		valid: false,
		error: 'Please select a supported provider from the list'
	};
}
