import type { DBType } from '@totallator/database';
import { journalEntry, tag, category, bill, budget } from '@totallator/database';
import { eq, desc, sql } from 'drizzle-orm';
import { journalMaterializedViewActions } from '../../actions/journalMaterializedViewActions';
import type { JournalTableType } from '@totallator/database';

export type MostUsedItemsType = {
	mostUsedTags: { id: string; title: string; count: number }[];
	mostUsedCategories: { id: string; title: string; count: number }[];
	mostUsedBills: { id: string; title: string; count: number }[];
	mostUsedBudgets: { id: string; title: string; count: number }[];
};

export class LLMContextService {
	private db: DBType;

	constructor(db: DBType) {
		this.db = db;
	}

	/**
	 * Fetches the latest X journals for a given account, with deduplication.
	 * @param accountId The ID of the account to fetch journals for.
	 * @param limit The maximum number of journals to fetch.
	 * @returns An array of journal entries.
	 */
	async getLatestJournalsForAccount(
		accountId: string,
		limit: number = 10
	): Promise<JournalTableType[]> {
		const journals = await this.db.query.journalEntry.findMany({
			where: eq(journalEntry.accountId, accountId),
			orderBy: desc(journalEntry.date),
			limit: limit,
			with: {
				account: true,
				bill: true,
				budget: true,
				category: true,
				tag: true
			}
		});

		// Simple deduplication based on description and amount for recent entries
		const seen = new Set<string>();
		const deduplicatedJournals: JournalTableType[] = [];
		for (const journal of journals) {
			const key = `${journal.description || ''}-${journal.amount}`;
			if (!seen.has(key)) {
				seen.add(key);
				deduplicatedJournals.push(journal);
			}
		}
		return deduplicatedJournals;
	}

	/**
	 * Fetches the most used tags, categories, bills, and budgets by count.
	 * @param limit The maximum number of items to fetch for each type.
	 * @returns An object containing arrays of most used items.
	 */
	async getMostUsedItems(limit: number = 10) {
		const [mostUsedTags, mostUsedCategories, mostUsedBills, mostUsedBudgets] = await Promise.all([
			this.db
				.select({
					id: tag.id,
					title: tag.title,
					count: sql<number>`count(${journalEntry.id})`.mapWith(Number)
				})
				.from(tag)
				.leftJoin(journalEntry, eq(tag.id, journalEntry.tagId))
				.groupBy(tag.id, tag.title)
				.orderBy(desc(sql<number>`count(${journalEntry.id})`))
				.limit(limit),

			this.db
				.select({
					id: category.id,
					title: category.title,
					count: sql<number>`count(${journalEntry.id})`.mapWith(Number)
				})
				.from(category)
				.leftJoin(journalEntry, eq(category.id, journalEntry.categoryId))
				.groupBy(category.id, category.title)
				.orderBy(desc(sql<number>`count(${journalEntry.id})`))
				.limit(limit),

			this.db
				.select({
					id: bill.id,
					title: bill.title,
					count: sql<number>`count(${journalEntry.id})`.mapWith(Number)
				})
				.from(bill)
				.leftJoin(journalEntry, eq(bill.id, journalEntry.billId))
				.groupBy(bill.id, bill.title)
				.orderBy(desc(sql<number>`count(${journalEntry.id})`))
				.limit(limit),

			this.db
				.select({
					id: budget.id,
					title: budget.title,
					count: sql<number>`count(${journalEntry.id})`.mapWith(Number)
				})
				.from(budget)
				.leftJoin(journalEntry, eq(budget.id, journalEntry.budgetId))
				.groupBy(budget.id, budget.title)
				.orderBy(desc(sql<number>`count(${journalEntry.id})`))
				.limit(limit)
		]);

		return {
			mostUsedTags,
			mostUsedCategories,
			mostUsedBills,
			mostUsedBudgets
		};
	}

	/**
	 * Fetches existing recommendations for a journal entry from the PostgreSQL recommendation engine.
	 * @param journalId The ID of the journal entry.
	 * @returns An array of recommendations.
	 */
	async getExistingRecommendations(journalId: string) {
		const recommendations = await journalMaterializedViewActions.listRecommendations({
			db: this.db,
			journals: [{ id: journalId, description: '', dataChecked: false, accountId: '' }]
		});
		return recommendations;
	}
}
