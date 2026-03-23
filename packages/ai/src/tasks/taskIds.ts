export const AI_TASK_IDS = {
	JOURNAL_RECOMMENDATION: 'journal-recommendation',
	INVOICE_VISION: 'invoice-vision',
	ASSISTANT_CHAT: 'assistant-chat'
} as const;

export type AITaskId = (typeof AI_TASK_IDS)[keyof typeof AI_TASK_IDS];
