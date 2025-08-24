import { eq } from 'drizzle-orm';

import { associatedInfoTable, fileTable } from '@totallator/database';

import { dbExecuteLogger } from '@/server/db/dbLogger';

import type { Tool, ToolExecutionContext, ToolExecutionResult } from '../types';

export const getInvoiceTextTool: Tool = {
	definition: {
		name: 'getInvoiceText',
		description:
			'Extract text content from an invoice or receipt file. Can be used with file_id or journal_id to get OCR text from attached documents.',
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
			// If file_id is provided, get specific file
			if (file_id) {
				const files = await dbExecuteLogger(
					context.db.select().from(fileTable).where(eq(fileTable.id, file_id)),
					'Get Invoice Text - Find File by ID'
				);

				if (files.length === 0) {
					return {
						success: false,
						error: `No file found with id: ${file_id}`
					};
				}

				// Process the single file
				const file = files[0];
				const results = [];

				// For now, we'll indicate that OCR would be needed
				if (file.filename) {
					results.push({
						file_id: file.id,
						filename: file.filename,
						original_filename: file.originalFilename || file.filename,
						text_content: null, // Text content would be extracted via OCR
						source: 'file_system',
						note: 'OCR processing would be required to extract text from this file',
						file_type: file.filename.split('.').pop()?.toLowerCase() || 'unknown',
						reason: file.reason
					});
				} else {
					results.push({
						file_id: file.id,
						filename: 'unknown',
						text_content: null,
						source: 'error',
						error: 'File has no filename'
					});
				}

				return {
					success: true,
					data: {
						files: results,
						count: results.length
					}
				};
			}

			// For journal_id, we need to find files linked to the transaction
			// Files are linked through associatedInfo -> transaction
			const filesWithAssociatedInfo = await dbExecuteLogger(
				context.db
					.select({
						id: fileTable.id,
						title: fileTable.title,
						filename: fileTable.filename,
						originalFilename: fileTable.originalFilename,
						type: fileTable.type,
						reason: fileTable.reason
					})
					.from(fileTable)
					.innerJoin(associatedInfoTable, eq(fileTable.associatedInfoId, associatedInfoTable.id))
					.where(eq(associatedInfoTable.transactionId, journal_id)),
				'Get Invoice Text - Find Files by Journal'
			);
			const files = filesWithAssociatedInfo;

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
					// For now, we'll indicate that OCR would be needed
					// In a real implementation, you might integrate with OCR services
					if (file.filename) {
						results.push({
							file_id: file.id,
							filename: file.filename,
							original_filename: file.originalFilename || file.filename,
							text_content: null, // Text content would be extracted via OCR
							source: 'file_system',
							note: 'OCR processing would be required to extract text from this file',
							file_type: file.filename.split('.').pop()?.toLowerCase() || 'unknown',
							reason: file.reason
						});
					} else {
						results.push({
							file_id: file.id,
							filename: 'unknown',
							text_content: null,
							source: 'no_file',
							note: 'No filename available'
						});
					}
				} catch (error) {
					results.push({
						file_id: file.id,
						filename: file.filename || 'unknown',
						text_content: null,
						source: 'error',
						error: error instanceof Error ? error.message : 'Unknown error'
					});
				}
			}

			return {
				success: true,
				data: {
					message: `Found ${files.length} files but no text content available (OCR would be required)`,
					query_info: {
						file_id: file_id || null,
						journal_id: journal_id || null,
						files_found: files.length
					},
					files: results,
					extracted_text: null
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
