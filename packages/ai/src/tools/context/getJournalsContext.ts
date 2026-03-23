import { eq } from 'drizzle-orm';
import { tool } from 'ai';
import { z } from 'zod';

import type { DBType } from '@totallator/database';
import { journalEntry } from '@totallator/database';

import { contextJournalSchema } from '../types';

const inputSchema = z.object({
	journalIds: z.array(z.string()).min(1),
	includeTransactionContext: z.boolean().default(true)
});

export const getJournalsContextInputSchema = inputSchema;

export const getJournalsContextOutputSchema = z.object({
	journals: z.array(contextJournalSchema),
	notes: z.array(z.string()).default([])
});

export type GetJournalsContextResult = z.infer<typeof getJournalsContextOutputSchema>;

/**
 * Stub implementation for the core journal context retrieval path.
 *
 * Intended future behavior:
 * - Load journals through business-logic, not direct DB access.
 * - Always include wider transaction context for each target journal.
 * - Include enriched import metadata and any other domain-approved context fields.
 */
export const getJournalsContextData = async ({
	db,
	journalIds,
	includeTransactionContext
}: {
	db: DBType;
	journalIds: string[];
	includeTransactionContext: boolean;
}): Promise<GetJournalsContextResult> => {
	const journals = await Promise.all(
		journalIds.map(async (journalId) => {
			const journal = await db.query.journalEntry.findFirst({
				where: eq(journalEntry.id, journalId),
				with: {
					importDetail: true
				}
			});

			if (!journal) {
				return {
					id: journalId,
					flags: {},
					transactionContext: []
				};
			}

			const transactionContext =
				includeTransactionContext && journal.transactionId
					? (
							await db.query.journalEntry.findMany({
								where: eq(journalEntry.transactionId, journal.transactionId)
							})
						)
							.filter((item) => item.id !== journal.id)
							.map((item) => ({
								journalId: item.id,
								accountId: item.accountId,
								description: item.description,
								amount: item.amount
							}))
					: [];

			return {
				id: journal.id,
				transactionId: journal.transactionId,
				description: journal.description,
				dateText: journal.dateText,
				amount: journal.amount,
				accountId: journal.accountId,
				importId: journal.importId,
				importDetailId: journal.importDetailId,
				importUniqueId: journal.importDetail?.uniqueId ?? null,
				flags: {
					dataChecked: journal.dataChecked,
					complete: journal.complete,
					linked: journal.linked,
					reconciled: journal.reconciled,
					transfer: journal.transfer
				},
				transactionContext
			};
		})
	);

	return {
		journals,
		notes: [
			'Stub journal context builder: will be migrated to business-logic-backed retrieval.',
			includeTransactionContext
				? 'Transaction context is included automatically in the journal context payload.'
				: 'Transaction context has been suppressed for this call.'
		]
	};
};

export const buildGetJournalsContextTool = (db: DBType) =>
	tool({
		description:
			'Load target journals with enriched metadata and automatic wider transaction context.',
		inputSchema,
		outputSchema: getJournalsContextOutputSchema,
		execute: async ({ journalIds, includeTransactionContext }) =>
			await getJournalsContextData({
				db,
				journalIds,
				includeTransactionContext
			})
	});
