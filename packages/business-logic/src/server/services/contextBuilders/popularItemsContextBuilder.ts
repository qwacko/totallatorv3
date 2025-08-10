import type { ContextBuilderParams } from './baseContextBuilder';
import type {
	LLMBatchContext,
	PopularItems,
	CategorizationOptions
} from '../llmBatchProcessingService';
import { journalMaterialisedList } from '../../../actions/helpers/journal/journalList';
import type { JournalFilterSchemaInputType } from '@totallator/shared';
import type { DBType } from '@totallator/database';
import { accountActions } from '@/actions/accountActions';
import { categoryActions } from '@/actions/categoryActions';
import { tagActions } from '@/actions/tagActions';
import { budgetActions } from '@/actions/budgetActions';
import { labelActions } from '@/actions/labelActions';
import { billActions } from '@/actions/billActions';

/**
 * Builds context for popular items (most used categories, tags, etc.) for the account
 * Also fetches all available categorization options
 */
export async function buildPopularItemsContext(
	params: ContextBuilderParams
): Promise<Partial<LLMBatchContext>> {
	const { db, accountId, config } = params;

	// Fetch account details
	const account = await accountActions.getById(accountId);
	if (!account) {
		throw new Error(`Account ${accountId} not found`);
	}

	// Get popular items by analyzing recent journal usage
	const popularItems = await getPopularItems(db, accountId, config.maxPopularItems);

	// Get all available options
	const allOptions = await getAllCategorizationOptions();

	return {
		account: {
			id: account.id,
			title: account.title,
			type: account.type
		},
		popularItems,
		allOptions
	};
}

/**
 * Get most popular categorization items for the account
 */
async function getPopularItems(
	db: DBType,
	accountId: string,
	maxItems: number
): Promise<PopularItems> {
	// Get journals from the last 6 months to analyze usage patterns
	const sixMonthsAgo = new Date();
	sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

	const filter: JournalFilterSchemaInputType = {
		account: {
			idArray: [accountId],
			type: ['asset', 'liability'] // Only same account types
		},
		// Remove dataChecked filter - include all journals with categorization data
		// Don't filter by llmReviewStatus - any journal with categories/tags is useful
		dateAfter: sixMonthsAgo.toISOString().split('T')[0],
		page: 0,
		pageSize: 1000, // Large enough to get good statistics
		orderBy: [{ field: 'date', direction: 'desc' }]
	};

	const journalsResult = await journalMaterialisedList({ db, filter });

	// Count usage frequency for each type
	const categoryCounts = new Map<string, { id: string; title: string; count: number }>();
	const tagCounts = new Map<string, { id: string; title: string; count: number }>();
	const billCounts = new Map<string, { id: string; title: string; count: number }>();
	const budgetCounts = new Map<string, { id: string; title: string; count: number }>();
	const labelCounts = new Map<string, { id: string; title: string; count: number }>();

	for (const journal of journalsResult.data) {
		// Count categories
		if (journal.categoryId && journal.categoryTitle) {
			const existing = categoryCounts.get(journal.categoryId) || {
				id: journal.categoryId,
				title: journal.categoryTitle,
				count: 0
			};
			categoryCounts.set(journal.categoryId, { ...existing, count: existing.count + 1 });
		}

		// Count tags
		if (journal.tagId && journal.tagTitle) {
			const existing = tagCounts.get(journal.tagId) || {
				id: journal.tagId,
				title: journal.tagTitle,
				count: 0
			};
			tagCounts.set(journal.tagId, { ...existing, count: existing.count + 1 });
		}

		// Count bills
		if (journal.billId && journal.billTitle) {
			const existing = billCounts.get(journal.billId) || {
				id: journal.billId,
				title: journal.billTitle,
				count: 0
			};
			billCounts.set(journal.billId, { ...existing, count: existing.count + 1 });
		}

		// Count budgets
		if (journal.budgetId && journal.budgetTitle) {
			const existing = budgetCounts.get(journal.budgetId) || {
				id: journal.budgetId,
				title: journal.budgetTitle,
				count: 0
			};
			budgetCounts.set(journal.budgetId, { ...existing, count: existing.count + 1 });
		}

		// Count labels
		if (journal.labels && journal.labels.length > 0) {
			for (const labelData of journal.labels) {
				if (labelData.id && labelData.title) {
					const existing = labelCounts.get(labelData.id) || {
						id: labelData.id,
						title: labelData.title,
						count: 0
					};
					labelCounts.set(labelData.id, { ...existing, count: existing.count + 1 });
				}
			}
		}
	}

	// Convert to sorted arrays (most used first)
	const sortByUsage = (a: { count: number }, b: { count: number }) => b.count - a.count;

	return {
		categories: Array.from(categoryCounts.values())
			.sort(sortByUsage)
			.slice(0, maxItems)
			.map((item) => ({ id: item.id, title: item.title, usageCount: item.count })),

		tags: Array.from(tagCounts.values())
			.sort(sortByUsage)
			.slice(0, maxItems)
			.map((item) => ({ id: item.id, title: item.title, usageCount: item.count })),

		bills: Array.from(billCounts.values())
			.sort(sortByUsage)
			.slice(0, maxItems)
			.map((item) => ({ id: item.id, title: item.title, usageCount: item.count })),

		budgets: Array.from(budgetCounts.values())
			.sort(sortByUsage)
			.slice(0, maxItems)
			.map((item) => ({ id: item.id, title: item.title, usageCount: item.count })),

		labels: Array.from(labelCounts.values())
			.sort(sortByUsage)
			.slice(0, maxItems)
			.map((item) => ({ id: item.id, title: item.title, usageCount: item.count }))
	};
}

/**
 * Get all available categorization options
 */
async function getAllCategorizationOptions(): Promise<CategorizationOptions> {
	const [categories, tags, bills, budgets, labels] = await Promise.all([
		categoryActions.list({ filter: { pageSize: 1000 } }),
		tagActions.list({ filter: { pageSize: 1000 } }),
		billActions.list({ filter: { pageSize: 1000 } }),
		budgetActions.list({ filter: { pageSize: 1000 } }),
		labelActions.list({ filter: { pageSize: 1000 } })
	]);

	return {
		categories: categories.data.map((item) => ({
			id: item.id,
			title: item.title,
			active: item.active
		})),
		tags: tags.data.map((item) => ({
			id: item.id,
			title: item.title,
			active: item.active
		})),
		bills: bills.data.map((item) => ({
			id: item.id,
			title: item.title,
			active: item.active
		})),
		budgets: budgets.data.map((item) => ({
			id: item.id,
			title: item.title,
			active: item.active
		})),
		labels: labels.data.map((item) => ({
			id: item.id,
			title: item.title,
			active: item.active
		}))
	};
}
