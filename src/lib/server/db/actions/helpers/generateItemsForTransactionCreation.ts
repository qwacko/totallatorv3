import type { CreateCombinedTransactionType } from '$lib/schema/journalSchema';
import type { DBType } from '../../db';
import { updatedTime } from './updatedTime';
import { nanoid } from 'nanoid';
import { generateItemsForJournalCreation } from './generateItemsForJournalCreation';

export const generateItemsForTransactionCreation = async (
	db: DBType,
	data: CreateCombinedTransactionType
) => {
	const transactionId = nanoid();
	const itemsForCreation = await Promise.all(
		data.map(async (journalData) => {
			return await generateItemsForJournalCreation(db, transactionId, journalData);
		})
	);

	return {
		transactions: [{ id: transactionId, ...updatedTime() }],
		journals: itemsForCreation.map(({ journal }) => journal),
		labels: itemsForCreation.map(({ labels }) => labels).reduce((a, b) => [...a, ...b], [])
	};
};
