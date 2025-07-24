import type { Tool, ToolExecutionContext, ToolExecutionResult } from '../types';
import { fileTable } from '../../../db/postgres/schema/transactionSchema';
import { dbExecuteLogger } from '../../../db/dbLogger';
import { eq, and } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { serverEnv } from '../../../serverEnv';

export const getInvoiceTextTool: Tool = {
	definition: {
		name: 'getInvoiceText',
		description: 'Extract text content from an invoice or receipt file. Can be used with file_id or journal_id to get OCR text from attached documents.',
		parameters: {
			file_id: {
				type: 'string',
				description: 'ID of the file to extract text from'
			},
			journal_id: {
				type: 'string',
				description: 'ID of the journal entry to get attached file text from'
			}
		},
		required: []
	},

	async execute(
		parameters: Record<string, any>,
		context: ToolExecutionContext
	): Promise<ToolExecutionResult> {
		try {
			const { file_id, journal_id } = parameters;

			if (!file_id && !journal_id) {
				return {
					success: false,
					error: 'Either file_id or journal_id must be provided'
				};
			}

			// Build query based on provided parameters
			let query = context.db.select().from(fileTable);

			if (file_id) {
				query = query.where(eq(fileTable.id, file_id));
			} else if (journal_id) {
				query = query.where(eq(fileTable.linkedTransactionId, journal_id));
			}

			const files = await dbExecuteLogger(query, 'Get Invoice Text - Find Files');

			if (files.length === 0) {
				return {
					success: false,
					error: file_id 
						? `No file found with id: ${file_id}` 
						: `No files found for journal entry: ${journal_id}`
				};
			}

			const results = [];

			for (const file of files) {
				try {
					// Check if file has text content
					if (file.textContent) {
						results.push({
							file_id: file.id,
							filename: file.filename,
							text_content: file.textContent,
							source: 'database'
						});
						continue;
					}

					// Try to read text from file system if available
					if (file.filename) {
						const filePath = join(serverEnv.FILE_DIR, file.filename);
						
						try {
							// For now, we'll indicate that OCR would be needed
							// In a real implementation, you might integrate with OCR services
							results.push({
								file_id: file.id,
								filename: file.filename,
								text_content: null,
								source: 'file_system',
								note: 'OCR processing would be required to extract text from this file',
								file_type: file.filename.split('.').pop()?.toLowerCase() || 'unknown'
							});
						} catch (fileError) {
							results.push({
								file_id: file.id,
								filename: file.filename,
								text_content: null,
								source: 'error',
								error: `Could not access file: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`
							});
						}
					} else {
						results.push({
							file_id: file.id,
							filename: file.filename,
							text_content: null,
							source: 'no_file',
							note: 'No filename or text content available'
						});
					}
				} catch (error) {
					results.push({
						file_id: file.id,
						filename: file.filename,
						text_content: null,
						source: 'error',
						error: error instanceof Error ? error.message : 'Unknown error'
					});
				}
			}

			// Filter out results that have actual text content
			const textResults = results.filter(r => r.text_content);

			return {
				success: true,
				data: {
					message: textResults.length > 0 
						? `Found text content in ${textResults.length} of ${files.length} files`
						: `Found ${files.length} files but no text content available`,
					query_info: {
						file_id: file_id || null,
						journal_id: journal_id || null,
						files_found: files.length
					},
					files: results,
					extracted_text: textResults.length > 0 
						? textResults.map(r => r.text_content).join('\n\n---\n\n')
						: null
				}
			};

		} catch (error) {
			return {
				success: false,
				error: `Failed to get invoice text: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		}
	}
};