import type { AITaskId } from '../tasks/taskIds';
import { AI_TASK_IDS } from '../tasks/taskIds';

export type AITaskModelProfile = {
	taskId: AITaskId;
	requiresVision?: boolean;
	preferredProviders: string[];
	defaultModel: string;
	fallbackModel?: string;
	temperature?: number;
	maxSteps?: number;
	structuredOutput: boolean;
};

export const TASK_MODEL_PROFILES: Record<AITaskId, AITaskModelProfile> = {
	[AI_TASK_IDS.JOURNAL_RECOMMENDATION]: {
		taskId: AI_TASK_IDS.JOURNAL_RECOMMENDATION,
		preferredProviders: ['openai', 'anthropic', 'openrouter'],
		defaultModel: 'gpt-4o-mini',
		fallbackModel: 'gpt-4o',
		temperature: 0,
		maxSteps: 6,
		structuredOutput: true
	},
	[AI_TASK_IDS.INVOICE_VISION]: {
		taskId: AI_TASK_IDS.INVOICE_VISION,
		requiresVision: true,
		preferredProviders: ['openai', 'google', 'openrouter'],
		defaultModel: 'gpt-4o',
		fallbackModel: 'gemini-1.5-pro',
		temperature: 0,
		maxSteps: 4,
		structuredOutput: true
	},
	[AI_TASK_IDS.ASSISTANT_CHAT]: {
		taskId: AI_TASK_IDS.ASSISTANT_CHAT,
		preferredProviders: ['anthropic', 'openai', 'openrouter'],
		defaultModel: 'claude-3-5-sonnet-20241022',
		fallbackModel: 'gpt-4o',
		temperature: 0.2,
		maxSteps: 8,
		structuredOutput: false
	}
};

export const getTaskModelProfile = (taskId: AITaskId): AITaskModelProfile =>
	TASK_MODEL_PROFILES[taskId];
