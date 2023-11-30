import type { CreateCombinedTransactionType } from '$lib/schema/journalSchema';
import type { DBType } from '../../../db';
import { updatedTime } from '../misc/updatedTime';
import { nanoid } from 'nanoid';
import { generateItemsForJournalCreation } from './generateItemsForJournalCreation';

export const generateItemsForTransactionCreation = async (
	db: DBType,
	data: CreateCombinedTransactionType
) => {
	const transactionId = nanoid();
	const itemsForCreation = [];

	//This is a for loop rather than map to avoid race conditions when creating linked items.
	for (const journalData of data) {
		const result = await generateItemsForJournalCreation(db, transactionId, journalData);
		itemsForCreation.push(result);
	}

	return {
		transactions: [{ id: transactionId, ...updatedTime() }],
		journals: itemsForCreation.map(({ journal }) => journal),
		labels: itemsForCreation.map(({ labels }) => labels).reduce((a, b) => [...a, ...b], [])
	};
};
