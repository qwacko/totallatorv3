import type { LlmSettings } from '../schema/llmSchema';

export class MockLLMClient {
	private settings: LlmSettings;

	constructor(settings: LlmSettings) {
		this.settings = settings;
	}

	public async call(prompt: string): Promise<any> {
		// Simulate a delay
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Return a predefined response based on the prompt
		if (prompt.includes('error')) {
			return { error: 'Simulated error' };
		}

		return { 
			choices: [
				{ 
					message: { 
						content: 'This is a mock response.' 
					}
				}
			]
		};
	}
}
