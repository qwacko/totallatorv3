import { describe, expect, it } from 'vitest';

import { AI_TASK_IDS } from '../tasks/taskIds';
import { resolveTaskModelSelection } from './modelResolver';

describe('resolveTaskModelSelection', () => {
	it('prefers the model configured on llm settings when present', () => {
		const selection = resolveTaskModelSelection({
			taskId: AI_TASK_IDS.JOURNAL_RECOMMENDATION,
			llmSettings: {
				apiUrl: 'openai',
				defaultModel: 'gpt-4.1-mini'
			}
		});

		expect(selection.providerId).toBe('openai');
		expect(selection.model).toBe('gpt-4.1-mini');
		expect(selection.structuredOutput).toBe(true);
	});

	it('uses the stored provider id from llm settings', () => {
		const selection = resolveTaskModelSelection({
			taskId: AI_TASK_IDS.INVOICE_VISION,
			llmSettings: {
				apiUrl: 'openrouter',
				defaultModel: null
			}
		});

		expect(selection.providerId).toBe('openrouter');
		expect(selection.requiresVision).toBe(true);
		expect(selection.model).toBeTruthy();
	});
});
