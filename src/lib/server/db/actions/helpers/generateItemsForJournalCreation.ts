import { createJournalDBCore, type CreateJournalSchemaType } from '$lib/schema/journalSchema';
import type { DBType } from '../../db';
import { updatedTime } from './updatedTime';
import { nanoid } from 'nanoid';
import { expandDate } from './expandDate';
import { journalGetOrCreateLinkedItems } from './accountGetOrCreateLinkedItems';

export const generateItemsForJournalCreation = async (
	db: DBType,
	transactionId: string,
	journalData: CreateJournalSchemaType
) => {
	const linkedCorrections = await journalGetOrCreateLinkedItems(db, journalData);
	const processedJournalData = createJournalDBCore.parse(linkedCorrections);
	const { labels, accountId, ...restJournalData } = processedJournalData;
	const id = nanoid();

	const journalForCreation = {
		id,
		transactionId,
		accountId: accountId || '',
		...restJournalData,
		...updatedTime(),
		...expandDate(restJournalData.date)
	};

	const labelsForCreation = labels
		? labels.map((label) => {
				const id = nanoid();
				return { id, journalId: id, labelId: label, ...updatedTime() };
		  })
		: [];

	return { journal: journalForCreation, labels: labelsForCreation };
};