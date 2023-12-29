import type { CreateCombinedTransactionType } from '$lib/schema/journalSchema';
import type { DBType } from '../../../db';
import { updatedTime } from '../misc/updatedTime';
import { nanoid } from 'nanoid';
import { generateItemsForJournalCreation } from './generateItemsForJournalCreation';
import { account, bill, budget, category, label, tag } from '$lib/server/db/postgres/schema';

export const getCachedData = async ({ db, count }: { db: DBType, count: number }) => {

	const useCache = count > 1;

	return {
		cachedAccounts: useCache ? await db
			.select({ id: account.id, title: account.accountTitleCombined, status: account.status })
			.from(account)
			.execute() : undefined,
		cachedBills: useCache ? await db.select({ id: bill.id, title: bill.title, status: bill.status }).from(bill).execute() : undefined,
		cachedBudgets: useCache ? await db
			.select({ id: budget.id, title: budget.title, status: budget.status })
			.from(budget)
			.execute() : undefined,
		cachedTags: useCache ? await db.select({ id: tag.id, title: tag.title, status: tag.status }).from(tag).execute() : undefined,
		cachedCategories: useCache ? await db
			.select({ id: category.id, title: category.title, status: category.status })
			.from(category)
			.execute() : undefined,
		cachedLabels: useCache ? await db.select({ id: label.id, title: label.title, status: label.status }).from(label).execute() : undefined
	}
}

export type LinkedCachedData = Awaited<ReturnType<typeof getCachedData>>;

export const generateItemsForTransactionCreation = async ({
	db,
	data, cachedData
}: {
	db: DBType;
	data: CreateCombinedTransactionType;
	cachedData?: LinkedCachedData
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
