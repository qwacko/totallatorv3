import type { Tool, ToolExecutionContext, ToolExecutionResult } from '../types';
import { journalEntry } from '@totallator/database';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { runInTransactionWithLogging } from '@totallator/context';
import { eq } from 'drizzle-orm';

export const updateJournalEntryTool: Tool = {
	definition: {
		name: 'updateJournalEntry',
		description:
			'Update specific fields of a journal entry. Can be used to modify payee, description, or other journal entry attributes based on LLM analysis.',
		parameters: {
			journal_id: {
				type: 'string',
				description: 'ID of the journal entry to update'
			},
			updates: {
				type: 'object',
				description: 'Object containing the fields to update',
				properties: {
					payee: {
						type: 'string',
						description: 'New payee name'
					},
					description: {
						type: 'string',
						description: 'New description'
					},
					note: {
						type: 'string',
						description: 'Additional notes'
					},
					complete: {
						type: 'boolean',
						description: 'Mark entry as complete or incomplete'
					}
				}
			}
		},
		required: ['journal_id', 'updates']
	},

	async execute(
		parameters: Record<string, any>,
		context: ToolExecutionContext
	): Promise<ToolExecutionResult> {
		try {
			const { journal_id, updates } = parameters;

			if (!journal_id || typeof journal_id !== 'string') {
				return {
					success: false,
					error: 'journal_id must be a valid string'
				};
			}

			if (!updates || typeof updates !== 'object') {
				return {
					success: false,
					error: 'updates must be an object containing fields to update'
				};
			}

			// Validate that we have valid update fields
			const allowedFields = ['payee', 'description', 'note', 'complete'];
			const updateFields = Object.keys(updates).filter((key) => allowedFields.includes(key));

			if (updateFields.length === 0) {
				return {
					success: false,
					error: `No valid update fields provided. Allowed fields: ${allowedFields.join(', ')}`
				};
			}

			// First, check if the journal entry exists
			const existingEntries = await dbExecuteLogger(
				context.db.select().from(journalEntry).where(eq(journalEntry.id, journal_id)),
				'Update Journal Entry - Check Existing'
			);

			if (existingEntries.length === 0) {
				return {
					success: false,
					error: `Journal entry not found with id: ${journal_id}`
				};
			}

			const existingEntry = existingEntries[0];

			// Build update object with only allowed fields
			const updateData: any = {
				updatedAt: new Date()
			};

			for (const field of updateFields) {
				updateData[field] = updates[field];
			}

			// Perform the update
			const updatedEntries = await runInTransactionWithLogging(
				'Update Journal Entry via LLM Tool',
				async () => {
					const updated = await dbExecuteLogger(
						context.db
							.update(journalEntry)
							.set(updateData)
							.where(eq(journalEntry.id, journal_id))
							.returning(),
						'Update Journal Entry - Execute Update'
					);

					return updated;
				}
			);

			if (updatedEntries.length === 0) {
				return {
					success: false,
					error: 'Failed to update journal entry'
				};
			}

			const updatedEntry = updatedEntries[0];

			// Create a summary of what changed
			const changes = [];
			for (const field of updateFields) {
				const oldValue = (existingEntry as any)[field];
				const newValue = (updatedEntry as any)[field];
				if (oldValue !== newValue) {
					changes.push({
						field,
						old_value: oldValue,
						new_value: newValue
					});
				}
			}

			return {
				success: true,
				data: {
					message: `Successfully updated journal entry ${journal_id}`,
					journal_id,
					changes_made: changes,
					updated_entry: {
						id: updatedEntry.id,
						description: updatedEntry.description,
						complete: updatedEntry.complete,
						amount: Number(updatedEntry.amount),
						date: updatedEntry.date?.toISOString().split('T')[0] || null,
						updated_at: updatedEntry.updatedAt?.toISOString()
					}
				}
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to update journal entry: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		}
	}
};
