import { createJournalDBCore, type CreateJournalSchemaType } from '@totallator/shared';
import type { DBType } from '@totallator/database';
import { updatedTime } from '../misc/updatedTime';
import { nanoid } from 'nanoid';
import { expandDate } from './expandDate';
import { journalGetOrCreateLinkedItems } from './journalGetOrCreateLinkedItems';
import type { StatusEnumType } from '@totallator/shared';
import { getServerEnv } from '@/serverEnv';
import type { LlmReviewStatusEnumType } from '@totallator/shared';
import { getLogger } from '@/logger';

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
	const startTime = Date.now();
	const journalId = nanoid();
	
	getLogger('journals').trace({
		code: 'JOURNAL_GEN_001',
		title: 'Starting journal item generation',
		transactionId,
		journalId,
		accountId: journalData.accountId,
		amount: journalData.amount,
		isImport
	});

	getLogger('journals').trace({
		code: 'JOURNAL_GEN_002',
		title: 'Processing linked items for journal',
		transactionId,
		journalId,
		hasCachedAccounts: !!cachedAccounts,
		hasCachedBills: !!cachedBills,
		hasCachedBudgets: !!cachedBudgets,
		hasCachedTags: !!cachedTags,
		hasCachedCategories: !!cachedCategories,
		hasCachedLabels: !!cachedLabels
	});

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

	getLogger('journals').trace({
		code: 'JOURNAL_GEN_003',
		title: 'Linked items processed, validating journal data',
		transactionId,
		journalId,
		linkedItemsProcessed: true
	});

	const processedJournalData = createJournalDBCore.safeParse(linkedCorrections);
	if (processedJournalData.error) {
		getLogger('journals').error({
			code: 'JOURNAL_GEN_004',
			title: 'Journal validation failed',
			transactionId,
			journalId,
			error: processedJournalData.error,
			currentJournal: linkedCorrections
		});
		throw new Error('Journal Creation Failed');
	}

	getLogger('journals').trace({
		code: 'JOURNAL_GEN_005',
		title: 'Journal data validated successfully',
		transactionId,
		journalId
	});
	const { labels, accountId, ...restJournalData } = processedJournalData.data;
	const id = journalId; // Use the previously generated ID

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

	getLogger('journals').trace({
		code: 'JOURNAL_GEN_006',
		title: 'LLM review status determined',
		transactionId,
		journalId: id,
		llmReviewStatus,
		isImport,
		llmEnabled: getServerEnv().LLM_REVIEW_ENABLED,
		autoImportReview: getServerEnv().LLM_REVIEW_AUTO_IMPORT,
		manualCreateReview: getServerEnv().LLM_REVIEW_MANUAL_CREATE
	});

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

	const duration = Date.now() - startTime;
	getLogger('journals').trace({
		code: 'JOURNAL_GEN_007',
		title: 'Journal item generation completed',
		transactionId,
		journalId: id,
		duration,
		labelCount: labelsForCreation.length,
		llmReviewStatus,
		accountId: accountId || '',
		amount: restJournalData.amount
	});

	return { journal: journalForCreation, labels: labelsForCreation };
};
