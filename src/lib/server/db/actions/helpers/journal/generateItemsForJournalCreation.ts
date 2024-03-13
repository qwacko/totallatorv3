import { createJournalDBCore, type CreateJournalSchemaType } from '$lib/schema/journalSchema';
import type { DBType } from '../../../db';
import { updatedTime } from '../misc/updatedTime';
import { nanoid } from 'nanoid';
import { expandDate } from './expandDate';
import { journalGetOrCreateLinkedItems } from './journalGetOrCreateLinkedItems';
import type { StatusEnumType } from '$lib/schema/statusSchema';

export const generateItemsForJournalCreation = async ({
	db,
	transactionId,
	journalData,
	cachedAccounts,
	cachedBills,
	cachedBudgets,
	cachedTags,
	cachedCategories,
	cachedLabels
}: {
	db: DBType;
	transactionId: string;
	journalData: CreateJournalSchemaType;
	cachedAccounts?: { id: string; title: string; status: StatusEnumType }[];
	cachedBills?: { id: string; title: string; status: StatusEnumType }[];
	cachedBudgets?: { id: string; title: string; status: StatusEnumType }[];
	cachedTags?: { id: string; title: string; status: StatusEnumType }[];
	cachedCategories?: { id: string; title: string; status: StatusEnumType }[];
	cachedLabels?: { id: string; title: string; status: StatusEnumType }[];
}) => {
	const linkedCorrections = await journalGetOrCreateLinkedItems({
		db,
		journalEntry: journalData,
		cachedAccounts,
		cachedBills,
		cachedBudgets,
		cachedTags,
		cachedCategories,
		cachedLabels
	});
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
				const relId = nanoid();
				return { id: relId, journalId: id, labelId: label, ...updatedTime() };
			})
		: [];

	return { journal: journalForCreation, labels: labelsForCreation };
};
