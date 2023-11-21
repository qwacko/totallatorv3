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
import { filterNullUndefinedAndDuplicates } from '../../../../routes/(loggedIn)/journals/filterNullUndefinedAndDuplicates';

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
		? sql`count(${journalEntry.id})`.mapWith(Number)
		: sql`count(CASE WHEN ${account.type} IN ('asset', 'liability') THEN 1 ELSE NULL END)`.mapWith(
				Number
		  ),
	firstDate: sql`min(${journalEntry.date})`.mapWith(journalEntry.date),
	lastDate: sql`max(${journalEntry.date})`.mapWith(journalEntry.date)
});

export const summaryActions = {
	markAsNeedingProcessing: async ({ db, ids }: { db: DBType; ids: string[] }) => {
		await db
			.update(summaryTable)
			.set({ needsUpdate: true })
			.where(inArray(summaryTable.relationId, ids))
			.execute();
	},
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
			return 0;
		}

		let updateCount = 0;

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

					updateCount += foundData.length;

					await Promise.all(
						foundData.map(async (currentFoundItem) => {
							const { summaryId, itemId, ...restFoundItem } = currentFoundItem;

							if (summaryId) {
								await db
									.update(summaryTable)
									.set({
										...restFoundItem,
										sum: restFoundItem.sum || 0,
										count: restFoundItem.count || 0,
										needsUpdate: false,
										...updatedTime()
									})
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
										sum: restFoundItem.sum || 0,
										count: restFoundItem.count || 0,
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
		return updateCount;
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
	},
	getUniqueTransactionInfo: async ({ db, ids }: { db: DBType; ids: string[] }) => {
		const bills = await db
			.select({ id: journalEntry.billId })
			.from(journalEntry)
			.where(inArray(journalEntry.transactionId, ids))
			.groupBy(journalEntry.billId)
			.execute();
		const budgets = await db
			.select({ id: journalEntry.budgetId })
			.from(journalEntry)
			.where(inArray(journalEntry.transactionId, ids))
			.groupBy(journalEntry.budgetId)
			.execute();
		const categories = await db
			.select({ id: journalEntry.categoryId })
			.from(journalEntry)
			.where(inArray(journalEntry.transactionId, ids))
			.groupBy(journalEntry.categoryId)
			.execute();
		const tags = await db
			.select({ id: journalEntry.tagId })
			.from(journalEntry)
			.where(inArray(journalEntry.transactionId, ids))
			.groupBy(journalEntry.tagId)
			.execute();
		const accounts = await db
			.select({ id: journalEntry.accountId })
			.from(journalEntry)
			.where(inArray(journalEntry.transactionId, ids))
			.groupBy(journalEntry.accountId)
			.execute();
		const labels = await db
			.select({ id: labelsToJournals.labelId })
			.from(labelsToJournals)
			.leftJoin(journalEntry, eq(labelsToJournals.journalId, journalEntry.id))
			.where(inArray(journalEntry.transactionId, ids))
			.groupBy(labelsToJournals.labelId)
			.execute();

		return filterNullUndefinedAndDuplicates([
			...budgets.map((item) => item.id),
			...bills.map((item) => item.id),
			...categories.map((item) => item.id),
			...tags.map((item) => item.id),
			...accounts.map((item) => item.id),
			...labels.map((item) => item.id)
		]);
	}
};
