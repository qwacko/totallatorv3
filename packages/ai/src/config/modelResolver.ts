import type { LLMSettings } from '@totallator/database';
import { tHelpers } from '@totallator/business-logic';

import type { AITaskId } from '../tasks/taskIds';
import { getTaskModelProfile } from './taskModelProfiles';

export type ResolvedTaskModelSelection = {
	taskId: AITaskId;
	providerId: string;
	model: string;
	temperature: number;
	maxSteps: number;
	structuredOutput: boolean;
	requiresVision: boolean;
};

export const resolveTaskModelSelection = ({
	taskId,
	llmSettings,
	overrideModel
}: {
	taskId: AITaskId;
	llmSettings: Pick<LLMSettings, 'apiUrl' | 'defaultModel'>;
	overrideModel?: string;
}): ResolvedTaskModelSelection => {
	const profile = getTaskModelProfile(taskId);
	const providerId = tHelpers.llmProvider.getProviderType(llmSettings.apiUrl);

	return {
		taskId,
		providerId,
		model: overrideModel || llmSettings.defaultModel || profile.defaultModel,
		temperature: profile.temperature ?? 0,
		maxSteps: profile.maxSteps ?? 4,
		structuredOutput: profile.structuredOutput,
		requiresVision: profile.requiresVision ?? false
	};
};
