import { describe, it, expect } from 'vitest';
import { MockLLMClient } from './mock';
import type { LLMSettings } from '../db/postgres/schema/llm';

describe('MockLLMClient', () => {
	it('should return a mock response', async () => {
		const settings: LLMSettings = {
			id: '1',
			title: 'test',
			apiUrl: 'http://localhost:8080',
			apiKey: 'test',
			defaultModel: 'claude',
			enabled: true,
			createdAt: new Date(),
			updatedAt: new Date()
		};
		const client = new MockLLMClient(settings);
		const response = await client.call('test prompt');
		expect(response.choices[0].message.content).toBe('This is a mock response.');
	});

	it('should return an error response', async () => {
		const settings: LLMSettings = {
			id: '1',
			title: 'test',
			apiUrl: 'http://localhost:8080',
			apiKey: 'test',
			enabled: true,
			defaultModel: 'claude',
			createdAt: new Date(),
			updatedAt: new Date()
		};
		const client = new MockLLMClient(settings);
		const response = await client.call('error prompt');
		expect(response.error).toBe('Simulated error');
	});
});
