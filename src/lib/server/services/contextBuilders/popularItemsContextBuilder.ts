import { BaseContextBuilder } from './baseContextBuilder';
import type { DBType } from '../../db/db';
import type { 
	LLMBatchContext, 
	BatchJournalData, 
	LLMBatchProcessingConfig,
	PopularItems,
	CategorizationOptions
} from '../llmBatchProcessingService';
import { tActions } from '../../db/actions/tActions';
import { journalMaterialisedList } from '../../db/actions/helpers/journal/journalList';
import type { JournalFilterSchemaInputType } from '$lib/schema/journalSchema';

/**
 * Builds context for popular items (most used categories, tags, etc.) for the account
 * Also fetches all available categorization options
 */
export class PopularItemsContextBuilder extends BaseContextBuilder {
	name = 'popular_items';
	enabled = true;
	priority = 3;
	
	async build(params: {
		db: DBType;
		accountId: string;
		uncategorizedJournals: BatchJournalData[];
		config: LLMBatchProcessingConfig;
	}): Promise<Partial<LLMBatchContext>> {
		const { db, accountId, config } = params;
		
		// Fetch account details
		const account = await tActions.account.getById(db, accountId);
		if (!account) {
			throw new Error(`Account ${accountId} not found`);
		}
		
		// Get popular items by analyzing recent journal usage
		const popularItems = await this.getPopularItems(db, accountId, config.maxPopularItems);
		
		// Get all available options
		const allOptions = await this.getAllCategorizationOptions(db);
		
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
	private async getPopularItems(db: DBType, accountId: string, maxItems: number): Promise<PopularItems> {
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
			orderBy: [
				{ field: 'date', direction: 'desc' }
			]
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
			if (journal.labels && journal.labelTitles) {
				for (let i = 0; i < journal.labels.length; i++) {
					const labelId = journal.labels[i];
					const labelTitle = journal.labelTitles[i];
					if (labelId && labelTitle) {
						const existing = labelCounts.get(labelId) || { 
							id: labelId, 
							title: labelTitle, 
							count: 0 
						};
						labelCounts.set(labelId, { ...existing, count: existing.count + 1 });
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
				.map(item => ({ id: item.id, title: item.title, usageCount: item.count })),
			
			tags: Array.from(tagCounts.values())
				.sort(sortByUsage)
				.slice(0, maxItems)
				.map(item => ({ id: item.id, title: item.title, usageCount: item.count })),
			
			bills: Array.from(billCounts.values())
				.sort(sortByUsage)
				.slice(0, maxItems)
				.map(item => ({ id: item.id, title: item.title, usageCount: item.count })),
			
			budgets: Array.from(budgetCounts.values())
				.sort(sortByUsage)
				.slice(0, maxItems)
				.map(item => ({ id: item.id, title: item.title, usageCount: item.count })),
			
			labels: Array.from(labelCounts.values())
				.sort(sortByUsage)
				.slice(0, maxItems)
				.map(item => ({ id: item.id, title: item.title, usageCount: item.count }))
		};
	}
	
	/**
	 * Get all available categorization options
	 */
	private async getAllCategorizationOptions(db: DBType): Promise<CategorizationOptions> {
		const [categories, tags, bills, budgets, labels] = await Promise.all([
			tActions.category.list({ db, filter: {} }),
			tActions.tag.list({ db, filter: {} }),
			tActions.bill.list({ db, filter: {} }),
			tActions.budget.list({ db, filter: {} }),
			tActions.label.list({ db, filter: {} })
		]);
		
		return {
			categories: categories.data.map(item => ({ 
				id: item.id, 
				title: item.title, 
				active: item.active 
			})),
			tags: tags.data.map(item => ({ 
				id: item.id, 
				title: item.title, 
				active: item.active 
			})),
			bills: bills.data.map(item => ({ 
				id: item.id, 
				title: item.title, 
				active: item.active 
			})),
			budgets: budgets.data.map(item => ({ 
				id: item.id, 
				title: item.title, 
				active: item.active 
			})),
			labels: labels.data.map(item => ({ 
				id: item.id, 
				title: item.title, 
				active: item.active 
			}))
		};
	}
}