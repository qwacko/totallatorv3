import { nanoid } from 'nanoid';

import type { DBType } from '@totallator/database';
import type { LLMSettings } from '@totallator/database';
import { llmLogs } from '@totallator/database';

import { dbExecuteLogger } from '@/server/db/dbLogger';

export interface LLMMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface LLMToolCall {
	id: string;
	type: 'function';
	function: {
		name: string;
		arguments: string;
	};
}

export interface LLMResponse {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: Array<{
		index: number;
		message: {
			role: 'assistant';
			content: string | null;
			tool_calls?: LLMToolCall[];
		};
		finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
	}>;
	usage?: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

export interface LLMTool {
	type: 'function';
	function: {
		name: string;
		description: string;
		parameters: {
			type: 'object';
			properties: Record<string, any>;
			required?: string[];
		};
	};
}

export interface LLMRequest {
	model: string;
	messages: LLMMessage[];
	tools?: LLMTool[];
	tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
	temperature?: number;
	max_tokens?: number;
}

export class LLMClient {
	private settings: LLMSettings;
	private db: DBType;

	constructor(settings: LLMSettings, db: DBType) {
		this.settings = settings;
		this.db = db;
	}

	async call(request: LLMRequest, relatedJournalId?: string): Promise<LLMResponse> {
		const startTime = Date.now();
		const logId = nanoid();

		try {
			const response = await this.makeRequest(request);
			const duration = Date.now() - startTime;

			// Log successful request
			await this.logRequest(logId, request, response, duration, 'SUCCESS', relatedJournalId);

			return response;
		} catch (error) {
			const duration = Date.now() - startTime;
			const errorResponse = {
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString()
			};

			// Log failed request
			await this.logRequest(logId, request, errorResponse, duration, 'ERROR', relatedJournalId);

			throw error;
		}
	}

	private async makeRequest(request: LLMRequest): Promise<LLMResponse> {
		const url = this.buildRequestUrl();
		const headers = this.buildHeaders();
		const body = this.adaptRequest(request);

		const response = await fetch(url, {
			method: 'POST',
			headers,
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			throw new Error(`LLM API request failed: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return this.adaptResponse(data);
	}

	private buildRequestUrl(): string {
		const baseUrl = this.settings.apiUrl.endsWith('/')
			? this.settings.apiUrl.slice(0, -1)
			: this.settings.apiUrl;

		// Detect provider based on URL
		if (baseUrl.includes('openai.com')) {
			return `${baseUrl}/chat/completions`;
		} else if (baseUrl.includes('anthropic.com')) {
			return `${baseUrl}/messages`;
		} else {
			// Default to OpenAI-compatible format
			return `${baseUrl}/chat/completions`;
		}
	}

	private buildHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json'
		};

		// Detect provider and set appropriate auth header
		if (this.settings.apiUrl.includes('anthropic.com')) {
			headers['x-api-key'] = this.settings.apiKey;
			headers['anthropic-version'] = '2023-06-01';
		} else {
			// Default to OpenAI format
			headers['Authorization'] = `Bearer ${this.settings.apiKey}`;
		}

		return headers;
	}

	private adaptRequest(request: LLMRequest): any {
		// Adapt request format based on provider
		if (this.settings.apiUrl.includes('anthropic.com')) {
			return this.adaptToAnthropicFormat(request);
		} else {
			// Default to OpenAI format
			return {
				...request,
				model: request.model || this.settings.defaultModel || 'gpt-3.5-turbo'
			};
		}
	}

	private adaptToAnthropicFormat(request: LLMRequest): any {
		// Convert OpenAI format to Anthropic format
		const systemMessage = request.messages.find((m) => m.role === 'system');
		const userMessages = request.messages.filter((m) => m.role !== 'system');

		return {
			model: request.model || this.settings.defaultModel || 'claude-3-sonnet-20240229',
			max_tokens: request.max_tokens || 1000,
			system: systemMessage?.content,
			messages: userMessages.map((msg) => ({
				role: msg.role === 'assistant' ? 'assistant' : 'user',
				content: msg.content
			}))
		};
	}

	private adaptResponse(data: any): LLMResponse {
		// Adapt response format based on provider
		if (this.settings.apiUrl.includes('anthropic.com')) {
			return this.adaptFromAnthropicFormat(data);
		} else {
			// Assume OpenAI format
			return data;
		}
	}

	private adaptFromAnthropicFormat(data: any): LLMResponse {
		// Convert Anthropic format to OpenAI format
		return {
			id: data.id,
			object: 'chat.completion',
			created: Math.floor(Date.now() / 1000),
			model: data.model,
			choices: [
				{
					index: 0,
					message: {
						role: 'assistant',
						content: data.content?.[0]?.text || data.content
					},
					finish_reason: data.stop_reason === 'end_turn' ? 'stop' : data.stop_reason
				}
			],
			usage: {
				prompt_tokens: data.usage?.input_tokens || 0,
				completion_tokens: data.usage?.output_tokens || 0,
				total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
			}
		};
	}

	private async logRequest(
		id: string,
		request: LLMRequest,
		response: any,
		duration: number,
		status: 'SUCCESS' | 'ERROR',
		relatedJournalId?: string
	): Promise<void> {
		try {
			await dbExecuteLogger(
				this.db.insert(llmLogs).values({
					id,
					llmSettingsId: this.settings.id,
					requestPayload: request,
					responsePayload: response,
					durationMs: duration,
					status,
					relatedJournalId: relatedJournalId || null
				}),
				'LLM Client - Log Request'
			);
		} catch (error) {
			console.error('Failed to log LLM request:', error);
		}
	}
}
