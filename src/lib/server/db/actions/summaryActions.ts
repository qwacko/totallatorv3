import { eq, inArray, sql, isNull } from 'drizzle-orm';
import {
	bill,
	budget,
	category,
	tag,
	account,
	label,
	summaryTable,
	journalEntry,
	labelsToJournals
} from '../schema';
import type { DBType } from '../db';
import { nanoid } from 'nanoid';
import { updatedTime } from './helpers/updatedTime';

export const summaryTableColumnsToSelect = {
	count: summaryTable.count,
	sum: summaryTable.sum,
	firstDate: summaryTable.firstDate,
	lastDate: summaryTable.lastDate
};

const aggregationColumns = (isAccount: boolean = false) => ({
	sum: isAccount
		? sql`sum(${journalEntry.amount})`.mapWith(Number)
		: sql`sum(CASE WHEN ${account.type} IN ('asset', 'liability') THEN ${journalEntry.amount} ELSE 0 END)`.mapWith(
				Number
		  ),
	count: isAccount
		? sql`count(${account.id})`.mapWith(Number)
		: sql`count(CASE WHEN ${account.type} IN ('asset', 'liability') THEN 1 ELSE NULL END)`.mapWith(
				Number
		  ),
	firstDate: sql`min(${journalEntry.date})`.mapWith(journalEntry.date),
	lastDate: sql`min(${journalEntry.date})`.mapWith(journalEntry.date)
});

export const summaryActions = {
	updateAndCreateMany: async ({
		db,
		ids,
		needsUpdateOnly = false,
		allowCreation = true
	}: {
		db: DBType;
		ids?: string[];
		needsUpdateOnly?: boolean;
		allowCreation?: boolean;
	}) => {
		if (ids && ids.length === 0) {
			return;
		}
		await db.transaction(async (db) => {
			const items = ['bill', 'budget', 'category', 'tag', 'account', 'label'] as const;

			await Promise.all(
				items.map(async (item) => {
					const targetTable =
						item === 'bill'
							? bill
							: item === 'budget'
							? budget
							: item === 'category'
							? category
							: item === 'tag'
							? tag
							: item === 'account'
							? account
							: item === 'label'
							? label
							: null;
					const journalIdColumn =
						item === 'bill'
							? journalEntry.billId
							: item === 'budget'
							? journalEntry.budgetId
							: item === 'category'
							? journalEntry.categoryId
							: item === 'tag'
							? journalEntry.tagId
							: item === 'account'
							? journalEntry.accountId
							: item === 'label'
							? journalEntry.id
							: null;
					if (!targetTable || !journalIdColumn) {
						throw new Error('No target table found for summary');
					}

					const foundData =
						item === 'label'
							? await db
									.select({
										itemId: targetTable.id,
										summaryId: summaryTable.id,
										...aggregationColumns(false)
									})
									.from(targetTable)
									.where(ids ? inArray(targetTable.id, ids) : sql`true`)
									.leftJoin(labelsToJournals, eq(labelsToJournals.labelId, targetTable.id))
									.leftJoin(journalEntry, eq(labelsToJournals.journalId, journalEntry.id))
									.leftJoin(summaryTable, eq(summaryTable.relationId, targetTable.id))
									.leftJoin(account, eq(account.id, journalEntry.accountId))
									.where(needsUpdateOnly ? eq(summaryTable.needsUpdate, true) : sql`true`)
									.groupBy(targetTable.id)
									.execute()
							: item === 'account'
							? await db
									.select({
										itemId: targetTable.id,
										summaryId: summaryTable.id,
										...aggregationColumns(true)
									})
									.from(targetTable)
									.where(ids ? inArray(targetTable.id, ids) : sql`true`)
									.leftJoin(journalEntry, eq(journalIdColumn, targetTable.id))
									.leftJoin(summaryTable, eq(summaryTable.relationId, targetTable.id))
									.where(needsUpdateOnly ? eq(summaryTable.needsUpdate, true) : sql`true`)
									.groupBy(targetTable.id)
									.execute()
							: await db
									.select({
										itemId: targetTable.id,
										summaryId: summaryTable.id,
										...aggregationColumns(false)
									})
									.from(targetTable)
									.where(ids ? inArray(targetTable.id, ids) : sql`true`)
									.leftJoin(journalEntry, eq(journalIdColumn, targetTable.id))
									.leftJoin(summaryTable, eq(summaryTable.relationId, targetTable.id))
									.leftJoin(account, eq(account.id, journalEntry.accountId))
									.where(needsUpdateOnly ? eq(summaryTable.needsUpdate, true) : sql`true`)
									.groupBy(targetTable.id)
									.execute();

					await Promise.all(
						foundData.map(async (currentFoundItem) => {
							const { summaryId, itemId, ...restFoundItem } = currentFoundItem;
							if (restFoundItem.sum === null) {
								console.log('Sum Is Null', currentFoundItem, item);
							}
							if (summaryId) {
								await db
									.update(summaryTable)
									.set({ ...restFoundItem, needsUpdate: false, ...updatedTime() })
									.where(eq(summaryTable.id, summaryId))
									.execute();
							} else if (allowCreation && itemId) {
								const newSummaryId = nanoid();
								await db
									.insert(summaryTable)
									.values({
										id: newSummaryId,
										relationId: itemId,
										type: item,
										...restFoundItem,
										needsUpdate: false,
										...updatedTime()
									})
									.execute();

								await db
									.update(targetTable)
									.set({ summaryId: newSummaryId })
									.where(eq(targetTable.id, itemId))
									.execute();
							}
						})
					);
				})
			);
		});
	},
	createMissing: async ({ db }: { db: DBType }) => {
		const items = ['bill', 'budget', 'category', 'tag', 'account', 'label'] as const;
		await db.transaction(async (db) => {
			await Promise.all(
				items.map(async (item) => {
					const targetTable =
						item === 'bill'
							? bill
							: item === 'budget'
							? budget
							: item === 'category'
							? category
							: item === 'tag'
							? tag
							: item === 'account'
							? account
							: item === 'label'
							? label
							: null;
					if (!targetTable) {
						throw new Error('No target table found for summary');
					}

					const foundData = await db
						.select({
							itemId: targetTable.id,
							summaryId: summaryTable.id
						})
						.from(targetTable)
						.leftJoin(summaryTable, eq(summaryTable.relationId, targetTable.id))
						.where(isNull(summaryTable.id))
						.execute();

					await Promise.all(
						foundData.map(async (currentFoundItem) => {
							const { itemId } = currentFoundItem;
							if (itemId) {
								const newSummaryId = nanoid();
								await db
									.insert(summaryTable)
									.values({
										id: newSummaryId,
										relationId: itemId,
										type: item,
										needsUpdate: true,
										...updatedTime()
									})
									.execute();

								await db
									.update(targetTable)
									.set({ summaryId: newSummaryId })
									.where(eq(targetTable.id, itemId))
									.execute();
							}
						})
					);
				})
			);
			await summaryActions.updateAndCreateMany({ db, needsUpdateOnly: true });
		});
	}
};
