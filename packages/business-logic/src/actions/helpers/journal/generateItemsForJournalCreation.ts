import { createJournalDBCore, type CreateJournalSchemaType } from '@totallator/shared';
import type { DBType } from '@totallator/database';
import { updatedTime } from '../misc/updatedTime';
import { nanoid } from 'nanoid';
import { expandDate } from './expandDate';
import { journalGetOrCreateLinkedItems } from './journalGetOrCreateLinkedItems';
import type { StatusEnumType } from '@totallator/shared';
import { getServerEnv } from '@/serverEnv';
import type { LlmReviewStatusEnumType } from '@totallator/shared';

export const generateItemsForJournalCreation = async ({
	db,
	transactionId,
	journalData,
	cachedAccounts,
	cachedBills,
	cachedBudgets,
	cachedTags,
	cachedCategories,
	cachedLabels,
	isImport = false
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
	isImport?: boolean;
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

	// Determine LLM review status based on environment variables
	const determineReviewStatus = (): LlmReviewStatusEnumType => {
		// If LLM review is globally disabled, never require review
		if (!getServerEnv().LLM_REVIEW_ENABLED) {
			return 'not_required';
		}

		// If this is an import and auto-import review is enabled
		if (isImport && getServerEnv().LLM_REVIEW_AUTO_IMPORT) {
			return 'required';
		}

		// If this is a manual creation and manual create review is enabled
		if (!isImport && getServerEnv().LLM_REVIEW_MANUAL_CREATE) {
			return 'required';
		}

		// Default to not required
		return 'not_required';
	};

	const llmReviewStatus = determineReviewStatus();

	const journalForCreation = {
		id,
		transactionId,
		accountId: accountId || '',
		...restJournalData,
		llmReviewStatus,
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
