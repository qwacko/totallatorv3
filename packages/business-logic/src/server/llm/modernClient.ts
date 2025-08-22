import { createOpenRouter } from '@openrouter/ai-sdk-provider';
// Vercel AI SDK imports
import { type CoreMessage, type CoreTool, generateObject, generateText } from 'ai';
import { nanoid } from 'nanoid';
import type { z } from 'zod';

import type { DBType } from '@totallator/database';
import type { LLMSettings } from '@totallator/database';
import { llmLogs } from '@totallator/database';

import { dbExecuteLogger } from '@/server/db/dbLogger';

// TODO: Re-enable when we implement proper factory patterns for these providers
// import { openai } from '@ai-sdk/openai';
// import { anthropic } from '@ai-sdk/anthropic';
// import { google } from '@ai-sdk/google';
// import { xai } from '@ai-sdk/xai';
// import { groq } from '@ai-sdk/groq';

// Provider configuration
import { getProviderType } from './providerConfig';

// ============================================================================
// Type Definitions
// ============================================================================

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

export interface LLMStructuredRequest<T> {
	model: string;
	messages: LLMMessage[];
	schema: z.ZodSchema<T>;
	temperature?: number;
	max_tokens?: number;
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

export interface LLMStructuredResponse<T> {
	id: string;
	object: string;
	created: number;
	model: string;
	object_data: T;
	usage?: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

// ============================================================================
// Modern LLM Client using Vercel AI SDK
// ============================================================================

export class ModernLLMClient {
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

	async callStructured<T>(
		request: LLMStructuredRequest<T>,
		relatedJournalId?: string
	): Promise<LLMStructuredResponse<T>> {
		const startTime = Date.now();
		const logId = nanoid();
		const { schema, ...loggableRequest } = request; // Exclude non-serializable schema

		try {
			const response = await this.makeStructuredRequest(request);
			const duration = Date.now() - startTime;

			// Log successful request
			await this.logRequest(
				logId,
				loggableRequest,
				response,
				duration,
				'SUCCESS',
				relatedJournalId
			);

			return response;
		} catch (error) {
			const duration = Date.now() - startTime;
			const errorResponse = {
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString()
			};

			// Log failed request
			await this.logRequest(
				logId,
				loggableRequest,
				errorResponse,
				duration,
				'ERROR',
				relatedJournalId
			);

			throw error;
		}
	}

	private async makeRequest(request: LLMRequest): Promise<LLMResponse> {
		// Get the model directly from provider
		const model = this.getModelFromProvider();

		// Convert our messages to Vercel AI SDK format
		const messages: CoreMessage[] = request.messages.map((msg) => ({
			role: msg.role,
			content: msg.content
		}));

		// Convert tools if provided
		const tools: Record<string, CoreTool> | undefined = request.tools
			? request.tools.reduce(
					(acc, tool) => {
						acc[tool.function.name] = {
							description: tool.function.description,
							parameters: tool.function.parameters
						};
						return acc;
					},
					{} as Record<string, CoreTool>
				)
			: undefined;

		// Make the request using Vercel AI SDK
		const result = await generateText({
			model,
			messages,
			tools,
			temperature: request.temperature,
			maxTokens: request.max_tokens
		});

		// Convert response back to our expected format
		return this.convertResponse(result, request.model);
	}

	private async makeStructuredRequest<T>(
		request: LLMStructuredRequest<T>
	): Promise<LLMStructuredResponse<T>> {
		// Get the model directly from provider
		const model = this.getModelFromProvider();

		// Convert our messages to Vercel AI SDK format
		const messages: CoreMessage[] = request.messages.map((msg) => ({
			role: msg.role,
			content: msg.content
		}));

		// Make the request using Vercel AI SDK
		const result = await generateObject({
			model,
			messages,
			schema: request.schema,
			temperature: request.temperature,
			maxTokens: request.max_tokens
		});

		// Convert response back to our expected format
		return this.convertStructuredResponse(result, request.model);
	}

	private convertStructuredResponse<T>(result: any, modelName: string): LLMStructuredResponse<T> {
		return {
			id: result.response?.id || nanoid(),
			object: 'structured.completion',
			created: Math.floor(Date.now() / 1000),
			model: modelName,
			object_data: result.object,
			usage: {
				prompt_tokens: result.usage?.promptTokens || 0,
				completion_tokens: result.usage?.completionTokens || 0,
				total_tokens: result.usage?.totalTokens || 0
			}
		};
	}

	private getModelFromProvider() {
		const modelName = this.settings.defaultModel;
		const providerType = getProviderType(this.settings.apiUrl);

		if (!modelName) {
			throw new Error('No default model specified in LLM settings');
		}

		// Create model directly from provider
		// For now, focus on getting OpenRouter working as it has the correct factory pattern
		switch (providerType) {
			case 'openrouter': {
				const provider = createOpenRouter({
					apiKey: this.settings.apiKey
				});
				return provider(modelName as any);
			}
			case 'openai':
			case 'anthropic':
			case 'google':
			case 'xai':
			case 'groq':
				// TODO: Implement other providers - for now throw error
				throw new Error(
					`Provider ${providerType} not yet implemented with AI SDK. Please use OpenRouter for now.`
				);
			default:
				throw new Error(`Unsupported provider type: ${providerType}`);
		}
	}

	private convertResponse(result: any, modelName: string): LLMResponse {
		// Extract tool calls if present
		const toolCalls: LLMToolCall[] =
			result.toolCalls?.map((call: any, index: number) => ({
				id: call.toolCallId || `call_${index}`,
				type: 'function' as const,
				function: {
					name: call.toolName,
					arguments: JSON.stringify(call.args)
				}
			})) || [];

		return {
			id: result.response?.id || nanoid(),
			object: 'chat.completion',
			created: Math.floor(Date.now() / 1000),
			model: modelName,
			choices: [
				{
					index: 0,
					message: {
						role: 'assistant',
						content: result.text || null,
						...(toolCalls.length > 0 && { tool_calls: toolCalls })
					},
					finish_reason: this.mapFinishReason(result.finishReason)
				}
			],
			usage: {
				prompt_tokens: result.usage?.promptTokens || 0,
				completion_tokens: result.usage?.completionTokens || 0,
				total_tokens: result.usage?.totalTokens || 0
			}
		};
	}

	private mapFinishReason(
		reason: string | undefined
	): 'stop' | 'length' | 'tool_calls' | 'content_filter' {
		switch (reason) {
			case 'stop':
			case 'end_turn':
				return 'stop';
			case 'length':
			case 'max_tokens':
				return 'length';
			case 'tool_calls':
			case 'tool-calls':
				return 'tool_calls';
			case 'content_filter':
			case 'content-filter':
				return 'content_filter';
			default:
				return 'stop';
		}
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
				'Modern LLM Client - Log Request'
			);
		} catch (error) {
			console.error('Failed to log LLM request:', error);
		}
	}
}

// ============================================================================
// Backward compatibility: Create a simple function to create the client
// ============================================================================

/**
 * Create a modern LLM client instance
 * This replaces the old LLMClient class with better provider support
 */
export function createLLMClient(settings: LLMSettings, db: DBType): ModernLLMClient {
	return new ModernLLMClient(settings, db);
}

/**
 * Simple function-based API for one-off requests
 */
export async function generateLLMResponse<T>(
	settings: LLMSettings,
	db: DBType,
	request: LLMRequest | LLMStructuredRequest<T>,
	relatedJournalId?: string
): Promise<LLMResponse | LLMStructuredResponse<T>> {
	const client = new ModernLLMClient(settings, db);
	if ('schema' in request) {
		return client.callStructured(request as LLMStructuredRequest<T>, relatedJournalId);
	} else {
		return client.call(request as LLMRequest, relatedJournalId);
	}
}
