import type {
	Tool,
	ToolCallRequest,
	ToolCallResponse,
	ToolExecutionContext,
	ToolExecutionResult
} from './types';
import { findSimilarJournalEntriesTool } from './implementations/findSimilarJournalEntries';
import { getInvoiceTextTool } from './implementations/getInvoiceText';
import { updateJournalEntryTool } from './implementations/updateJournalEntry';
import { journalCategorizationTool } from './implementations/journalCategorization';

export class ToolDispatcher {
	private tools: Map<string, Tool> = new Map();

	constructor() {
		this.registerTool(findSimilarJournalEntriesTool);
		this.registerTool(getInvoiceTextTool);
		this.registerTool(updateJournalEntryTool);
		this.registerTool(journalCategorizationTool);
	}

	private registerTool(tool: Tool): void {
		this.tools.set(tool.definition.name, tool);
	}

	/**
	 * Get all available tool definitions for LLM function calling
	 */
	getToolDefinitions(): Array<{
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
	}> {
		return Array.from(this.tools.values()).map((tool) => ({
			type: 'function',
			function: {
				name: tool.definition.name,
				description: tool.definition.description,
				parameters: {
					type: 'object',
					properties: tool.definition.parameters,
					required: tool.definition.required || []
				}
			}
		}));
	}

	/**
	 * Execute a tool call from the LLM
	 */
	async executeToolCall(
		request: ToolCallRequest,
		context: ToolExecutionContext
	): Promise<ToolCallResponse> {
		const tool = this.tools.get(request.name);

		if (!tool) {
			return {
				name: request.name,
				result: {
					success: false,
					error: `Tool '${request.name}' not found`
				}
			};
		}

		try {
			// Validate parameters
			const validationResult = this.validateParameters(tool, request.parameters);
			if (!validationResult.success) {
				return {
					name: request.name,
					result: {
						success: false,
						error: `Parameter validation failed: ${validationResult.error}`
					}
				};
			}

			// Execute the tool
			const result = await tool.execute(request.parameters, context);

			return {
				name: request.name,
				result
			};
		} catch (error) {
			return {
				name: request.name,
				result: {
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error occurred'
				}
			};
		}
	}

	/**
	 * Execute multiple tool calls
	 */
	async executeToolCalls(
		requests: ToolCallRequest[],
		context: ToolExecutionContext
	): Promise<ToolCallResponse[]> {
		return Promise.all(requests.map((request) => this.executeToolCall(request, context)));
	}

	/**
	 * Check if a tool exists
	 */
	hasTool(name: string): boolean {
		return this.tools.has(name);
	}

	/**
	 * Get available tool names
	 */
	getToolNames(): string[] {
		return Array.from(this.tools.keys());
	}

	private validateParameters(tool: Tool, parameters: Record<string, any>): ToolExecutionResult {
		const definition = tool.definition;

		// Check required parameters
		const required = definition.required || [];
		for (const requiredParam of required) {
			if (!(requiredParam in parameters)) {
				return {
					success: false,
					error: `Missing required parameter: ${requiredParam}`
				};
			}
		}

		// Validate parameter types
		for (const [paramName, paramValue] of Object.entries(parameters)) {
			const paramDef = definition.parameters[paramName];
			if (!paramDef) {
				return {
					success: false,
					error: `Unknown parameter: ${paramName}`
				};
			}

			const validationError = this.validateParameterType(paramName, paramValue, paramDef);
			if (validationError) {
				return {
					success: false,
					error: validationError
				};
			}
		}

		return { success: true };
	}

	private validateParameterType(name: string, value: any, definition: any): string | null {
		const expectedType = definition.type;

		switch (expectedType) {
			case 'string':
				if (typeof value !== 'string') {
					return `Parameter '${name}' must be a string, got ${typeof value}`;
				}
				break;
			case 'number':
				if (typeof value !== 'number') {
					return `Parameter '${name}' must be a number, got ${typeof value}`;
				}
				break;
			case 'boolean':
				if (typeof value !== 'boolean') {
					return `Parameter '${name}' must be a boolean, got ${typeof value}`;
				}
				break;
			case 'object':
				if (typeof value !== 'object' || value === null || Array.isArray(value)) {
					return `Parameter '${name}' must be an object, got ${typeof value}`;
				}
				break;
			case 'array':
				if (!Array.isArray(value)) {
					return `Parameter '${name}' must be an array, got ${typeof value}`;
				}
				break;
		}

		// Check enum values
		if (definition.enum && !definition.enum.includes(value)) {
			return `Parameter '${name}' must be one of: ${definition.enum.join(', ')}`;
		}

		return null;
	}
}
