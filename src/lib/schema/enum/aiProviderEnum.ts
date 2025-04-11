export const aiProviderEnum = ['openrouter', 'openai', 'google', 'anthropic'] as const;
export type AiProviderType = (typeof aiProviderEnum)[number];
export const aiProviderEnumInfo = {
	openrouter: {
		id: 'openrouter',
		name: 'OpenRouter'
	},
	openai: {
		id: 'openai',
		name: 'OpenAI'
	},
	google: {
		id: 'google',
		name: 'Google'
	},
	anthropic: {
		id: 'anthropic',
		name: 'Anthropic'
	}
} satisfies {
	[key in AiProviderType]: {
		id: key;
		name: string;
	};
};
export type AiProviderInfoType = typeof aiProviderEnumInfo;
export const aiProviderDropdown = Object.values(aiProviderEnumInfo).map((option) => {
	return {
		name: option.name,
		value: option.id
	};
});
export const aiProviderToText = (aiProvider: AiProviderType) => {
	return aiProviderEnumInfo[aiProvider].name;
};
