import type { CreateCombinedTransactionType } from '$lib/schema/journalSchema';
import type { DBType } from '../../../db';
import { updatedTime } from '../misc/updatedTime';
import { nanoid } from 'nanoid';
import { generateItemsForJournalCreation } from './generateItemsForJournalCreation';
import { account, bill, budget, category, label, tag } from '$lib/server/db/postgres/schema';
import { dbExecuteLogger } from '$lib/server/db/dbLogger';

export const getCachedData = async ({ db, count }: { db: DBType; count: number }) => {
	const useCache = count > 1;

	return {
		cachedAccounts: useCache
			? await dbExecuteLogger(
					db
						.select({ id: account.id, title: account.accountTitleCombined, status: account.status })
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
					db.select({ id: budget.id, title: budget.title, status: budget.status }).from(budget),
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
						.select({ id: category.id, title: category.title, status: category.status })
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
};

export type LinkedCachedData = Awaited<ReturnType<typeof getCachedData>>;

export const generateItemsForTransactionCreation = async ({
	db,
	data,
	cachedData
}: {
	db: DBType;
	data: CreateCombinedTransactionType;
	cachedData?: LinkedCachedData;
}) => {
	const transactionId = nanoid();
	const itemsForCreation = [];

	//This is a for loop rather than map to avoid race conditions when creating linked items.
	for (const journalData of data) {
		const result = await generateItemsForJournalCreation({
			db,
			transactionId,
			journalData,
			cachedAccounts: cachedData?.cachedAccounts,
			cachedBills: cachedData?.cachedBills,
			cachedBudgets: cachedData?.cachedBudgets,
			cachedTags: cachedData?.cachedTags,
			cachedCategories: cachedData?.cachedCategories,
			cachedLabels: cachedData?.cachedLabels
		});
		itemsForCreation.push(result);
	}

	return {
		transactions: [{ id: transactionId, ...updatedTime() }],
		journals: itemsForCreation.map(({ journal }) => journal),
		labels: itemsForCreation.map(({ labels }) => labels).reduce((a, b) => [...a, ...b], [])
	};
};
