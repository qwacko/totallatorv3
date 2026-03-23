import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { createXai } from '@ai-sdk/xai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModel } from 'ai';

import type { ResolvedTaskModelSelection } from './modelResolver';

export const createLanguageModelForSelection = ({
	selection,
	apiKey
}: {
	selection: ResolvedTaskModelSelection;
	apiKey: string;
}): LanguageModel => {
	switch (selection.providerId) {
		case 'anthropic':
			return createAnthropic({ apiKey })(selection.model);
		case 'google':
			return createGoogleGenerativeAI({ apiKey })(selection.model);
		case 'groq':
			return createGroq({ apiKey })(selection.model);
		case 'xai':
			return createXai({ apiKey })(selection.model);
		case 'openrouter':
			return createOpenRouter({ apiKey })(selection.model);
		case 'openai':
		default: {
			return createOpenAI({ apiKey })(selection.model);
		}
	}
};
