import { nanoid } from 'nanoid';

import type { DBType } from '@totallator/database';
import { account, bill, budget, category, label, tag } from '@totallator/database';
import type { CreateCombinedTransactionType } from '@totallator/shared';

import { getLogger } from '@/logger';
import { dbExecuteLogger } from '@/server/db/dbLogger';

import { updatedTime } from '../misc/updatedTime';
import { generateItemsForJournalCreation } from './generateItemsForJournalCreation';

export const getCachedData = async ({ db, count }: { db: DBType; count: number }) => {
	const useCache = count > 1;

	getLogger('journals').debug({
		code: 'TRANS_GEN_001',
		title: 'Starting cache data retrieval',
		count,
		useCache
	});

	const startTime = Date.now();

	const result = {
		cachedAccounts: useCache
			? await dbExecuteLogger(
					db
						.select({
							id: account.id,
							title: account.accountTitleCombined,
							status: account.status
						})
						.from(account),
					'getCachedData - Accounts'
				)
			: undefined,
		cachedBills: useCache
			? await dbExecuteLogger(
					db.select({ id: bill.id, title: bill.title, status: bill.status }).from(bill),
					'getCachedData - Bills'
				)
			: undefined,
		cachedBudgets: useCache
			? await dbExecuteLogger(
					db
						.select({
							id: budget.id,
							title: budget.title,
							status: budget.status
						})
						.from(budget),
					'getCachedData - Budgets'
				)
			: undefined,
		cachedTags: useCache
			? await dbExecuteLogger(
					db.select({ id: tag.id, title: tag.title, status: tag.status }).from(tag),
					'getCachedData - Tags'
				)
			: undefined,
		cachedCategories: useCache
			? await dbExecuteLogger(
					db
						.select({
							id: category.id,
							title: category.title,
							status: category.status
						})
						.from(category),
					'getCachedData - Categories'
				)
			: undefined,
		cachedLabels: useCache
			? await dbExecuteLogger(
					db.select({ id: label.id, title: label.title, status: label.status }).from(label),
					'getCachedData - Labels'
				)
			: undefined
	};

	if (useCache) {
		const duration = Date.now() - startTime;
		getLogger('journals').info({
			code: 'TRANS_GEN_002',
			title: 'Cache data retrieval completed',
			duration,
			accountCount: result.cachedAccounts?.length || 0,
			billCount: result.cachedBills?.length || 0,
			budgetCount: result.cachedBudgets?.length || 0,
			tagCount: result.cachedTags?.length || 0,
			categoryCount: result.cachedCategories?.length || 0,
			labelCount: result.cachedLabels?.length || 0
		});
	}

	return result;
};

export type LinkedCachedData = Awaited<ReturnType<typeof getCachedData>>;

export const generateItemsForTransactionCreation = async ({
	db,
	data,
	cachedData,
	isImport = false
}: {
	db: DBType;
	data: CreateCombinedTransactionType;
	cachedData?: LinkedCachedData;
	isImport?: boolean;
}) => {
	const startTime = Date.now();
	const transactionId = nanoid();
	const itemsForCreation = [];

	getLogger('journals').debug({
		code: 'TRANS_GEN_003',
		title: 'Starting transaction items generation',
		transactionId,
		journalCount: data.length,
		isImport,
		hasCachedData: !!cachedData
	});

	//This is a for loop rather than map to avoid race conditions when creating linked items.
	for (const [index, journalData] of data.entries()) {
		getLogger('journals').trace({
			code: 'TRANS_GEN_004',
			title: 'Processing journal entry',
			transactionId,
			journalIndex: index,
			totalJournals: data.length,
			accountId: journalData.accountId
		});

		const result = await generateItemsForJournalCreation({
			db,
			transactionId,
			journalData,
			cachedAccounts: cachedData?.cachedAccounts,
			cachedBills: cachedData?.cachedBills,
			cachedBudgets: cachedData?.cachedBudgets,
			cachedTags: cachedData?.cachedTags,
			cachedCategories: cachedData?.cachedCategories,
			cachedLabels: cachedData?.cachedLabels,
			isImport
		});
		itemsForCreation.push(result);
	}

	const journals = itemsForCreation.map(({ journal }) => journal);
	const labels = itemsForCreation.map(({ labels }) => labels).reduce((a, b) => [...a, ...b], []);

	const duration = Date.now() - startTime;
	getLogger('journals').debug({
		code: 'TRANS_GEN_005',
		title: 'Transaction items generation completed',
		transactionId,
		duration,
		journalCount: journals.length,
		labelCount: labels.length,
		isImport
	});

	return {
		transactions: [{ id: transactionId, ...updatedTime() }],
		journals,
		labels
	};
};
