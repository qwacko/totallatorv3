import type { DBType } from '../../db/db';

export interface ToolParameter {
	type: 'string' | 'number' | 'boolean' | 'object' | 'array';
	description: string;
	required?: boolean;
	enum?: string[];
	properties?: Record<string, ToolParameter>;
}

export interface ToolDefinition {
	name: string;
	description: string;
	parameters: Record<string, ToolParameter>;
	required?: string[];
}

export interface ToolExecutionContext {
	db: DBType;
	userId?: string;
	journalId?: string;
}

export interface ToolExecutionResult {
	success: boolean;
	data?: any;
	error?: string;
}

export interface Tool {
	definition: ToolDefinition;
	execute: (
		parameters: Record<string, any>,
		context: ToolExecutionContext
	) => Promise<ToolExecutionResult>;
}

export interface ToolCallRequest {
	name: string;
	parameters: Record<string, any>;
}

export interface ToolCallResponse {
	name: string;
	result: ToolExecutionResult;
}
