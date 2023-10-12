import {
	type CreateCombinedTransactionType,
	type JournalFilterSchemaType,
	journalFilterSchema,
	defaultJournalFilter,
	type JournalFilterSchemaInputType,
	type UpdateJournalSchemaInputType,
	updateJournalSchema
} from '$lib/schema/journalSchema';
import { eq, and, sql, inArray, not, SQL, or } from 'drizzle-orm';
import type { DBType } from '../db';
import {
	account,
	journalEntry,
	bill,
	budget,
	category,
	tag,
	transaction,
	labelsToJournals,
	label
} from '../schema';
import { journalFilterToQuery } from './helpers/journalFilterToQuery';

import { updatedTime } from './helpers/updatedTime';
import { expandDate } from './helpers/expandDate';
import { accountActions } from './accountActions';
import { tActions } from './tActions';
import { seedTransactionData } from './helpers/seedTransactionData';
import { logging } from '$lib/server/logging';
import { getMonthlySummary } from './helpers/getMonthlySummary';
import { getCommonData, getCommonLabelData } from './helpers/getCommonData';
import { handleLinkedItem } from './helpers/handleLinkedItem';
import { generateItemsForTransactionCreation } from './helpers/generateItemsForTransactionCreation';
import { splitArrayIntoChunks } from './helpers/splitArrayIntoChunks';
import { journalList } from './helpers/journalList';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { summaryCacheDataSchema } from '$lib/schema/summaryCacheSchema';
import { nanoid } from 'nanoid';

export const journalActions = {
	getById: async (db: DBType, id: string) => {
		return db.query.journalEntry.findFirst({ where: eq(journalEntry.id, id) }).execute();
	},
	count: async (db: DBType, filter?: JournalFilterSchemaType) => {
		const countQueryCore = db
			.select({ count: sql<number>`count(${journalEntry.id})`.mapWith(Number) })
			.from(journalEntry)
			.leftJoin(account, eq(journalEntry.accountId, account.id))
			.leftJoin(bill, eq(journalEntry.billId, bill.id))
			.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
			.leftJoin(category, eq(journalEntry.categoryId, category.id))
			.leftJoin(tag, eq(journalEntry.tagId, tag.id))
			.where(and(...(filter ? await journalFilterToQuery(filter) : [])));

		const count = await countQueryCore.execute();

		return count[0].count;
	},
	sum: async (db: DBType, filter?: JournalFilterSchemaType) => {
		const countQueryCore = db
			.select({ sum: sql<number>`sum(${journalEntry.amount})`.mapWith(Number) })
			.from(journalEntry)
			.leftJoin(account, eq(journalEntry.accountId, account.id))
			.leftJoin(bill, eq(journalEntry.billId, bill.id))
			.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
			.leftJoin(category, eq(journalEntry.categoryId, category.id))
			.leftJoin(tag, eq(journalEntry.tagId, tag.id))
			.where(and(...(filter ? await journalFilterToQuery(filter) : [])));

		const count = await countQueryCore.execute();

		return count[0].sum;
	},
	summary: async ({
		db,
		filter,
		startDate,
		endDate
	}: {
		db: DBType;
		filter?: JournalFilterSchemaType;
		startDate?: string;
		endDate?: string;
	}) => {
		const commonSummary = {
			count: sql`count(${journalEntry.id})`.mapWith(Number),
			sum: sql`sum(${journalEntry.amount})`.mapWith(Number),
			average: sql`avg(${journalEntry.amount})`.mapWith(Number),
			earliest: sql`min(${journalEntry.dateText})`.mapWith(journalEntry.dateText),
			latest: sql`max(${journalEntry.dateText})`.mapWith(journalEntry.dateText),
			lastUpdated: sql`max(${journalEntry.updatedAt})`.mapWith(journalEntry.updatedAt)
		} satisfies Record<string, SQL<unknown> | SQLiteColumn>;

		const summaryQueryCore = db
			.select(commonSummary)
			.from(journalEntry)
			.leftJoin(account, eq(journalEntry.accountId, account.id))
			.leftJoin(bill, eq(journalEntry.billId, bill.id))
			.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
			.leftJoin(category, eq(journalEntry.categoryId, category.id))
			.leftJoin(tag, eq(journalEntry.tagId, tag.id))
			.where(and(...(filter ? await journalFilterToQuery(filter) : [])));

		const tagsQuery = db
			.select({
				id: tag.id,
				title: tag.title,
				...commonSummary
			})
			.from(journalEntry)
			.leftJoin(account, eq(journalEntry.accountId, account.id))
			.leftJoin(bill, eq(journalEntry.billId, bill.id))
			.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
			.leftJoin(category, eq(journalEntry.categoryId, category.id))
			.leftJoin(tag, eq(journalEntry.tagId, tag.id))
			.where(and(...(filter ? await journalFilterToQuery(filter) : [])))
			.groupBy(tag.id, tag.title)
			.execute();

		const categoriesQuery = db
			.select({
				id: category.id,
				title: category.title,
				...commonSummary
			})
			.from(journalEntry)
			.leftJoin(account, eq(journalEntry.accountId, account.id))
			.leftJoin(bill, eq(journalEntry.billId, bill.id))
			.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
			.leftJoin(category, eq(journalEntry.categoryId, category.id))
			.leftJoin(tag, eq(journalEntry.tagId, tag.id))
			.where(and(...(filter ? await journalFilterToQuery(filter) : [])))
			.groupBy(category.id, category.title)
			.execute();

		const billsQuery = db
			.select({
				id: bill.id,
				title: bill.title,
				...commonSummary
			})
			.from(journalEntry)
			.leftJoin(account, eq(journalEntry.accountId, account.id))
			.leftJoin(bill, eq(journalEntry.billId, bill.id))
			.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
			.leftJoin(category, eq(journalEntry.categoryId, category.id))
			.leftJoin(tag, eq(journalEntry.tagId, tag.id))
			.where(and(...(filter ? await journalFilterToQuery(filter) : [])))
			.groupBy(bill.id, bill.title)
			.execute();

		const budgetsQuery = db
			.select({
				id: budget.id,
				title: budget.title,
				...commonSummary
			})
			.from(journalEntry)
			.leftJoin(account, eq(journalEntry.accountId, account.id))
			.leftJoin(bill, eq(journalEntry.billId, bill.id))
			.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
			.leftJoin(category, eq(journalEntry.categoryId, category.id))
			.leftJoin(tag, eq(journalEntry.tagId, tag.id))
			.where(and(...(filter ? await journalFilterToQuery(filter) : [])))
			.groupBy(budget.id, budget.title)
			.execute();

		const accountsQuery = db
			.select({
				id: account.id,
				title: account.title,
				...commonSummary
			})
			.from(journalEntry)
			.leftJoin(account, eq(journalEntry.accountId, account.id))
			.leftJoin(bill, eq(journalEntry.billId, bill.id))
			.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
			.leftJoin(category, eq(journalEntry.categoryId, category.id))
			.leftJoin(tag, eq(journalEntry.tagId, tag.id))
			.where(and(...(filter ? await journalFilterToQuery(filter) : [])))
			.groupBy(account.id, account.title)
			.execute();

		const monthlyQueryCore = db
			.select({
				yearMonth: journalEntry.yearMonth,
				count: sql`count(${journalEntry.id})`.mapWith(Number),
				sum: sql`sum(${journalEntry.amount})`.mapWith(Number),
				average: sql`avg(${journalEntry.amount})`.mapWith(Number),
				positiveSum:
					sql`SUM(CASE WHEN ${journalEntry.amount} > 0 THEN ${journalEntry.amount} ELSE 0 END)`.mapWith(
						Number
					),
				positiveCount: sql`SUM(CASE WHEN ${journalEntry.amount} > 0 THEN 1 ELSE 0 END)`.mapWith(
					Number
				),
				negativeSum:
					sql`SUM(CASE WHEN ${journalEntry.amount} < 0 THEN ${journalEntry.amount} ELSE 0 END)`.mapWith(
						Number
					),
				negativeCount: sql`SUM(CASE WHEN ${journalEntry.amount} < 0 THEN 1 ELSE 0 END)`.mapWith(
					Number
				)
			})
			.from(journalEntry)
			.leftJoin(account, eq(journalEntry.accountId, account.id))
			.leftJoin(bill, eq(journalEntry.billId, bill.id))
			.leftJoin(budget, eq(journalEntry.budgetId, budget.id))
			.leftJoin(category, eq(journalEntry.categoryId, category.id))
			.leftJoin(tag, eq(journalEntry.tagId, tag.id))
			.where(and(...(filter ? await journalFilterToQuery(filter) : [])))
			.groupBy(journalEntry.yearMonth);

		const summaryQuery = (await summaryQueryCore.execute())[0];

		const monthlyQuery = await monthlyQueryCore.execute();

		const monthlySummary = getMonthlySummary({
			monthlyQuery,
			startDate,
			endDate,
			defaultValue: {
				sum: 0,
				average: 0,
				count: 0,
				negativeCount: 0,
				positiveCount: 0,
				negativeSum: 0,
				positiveSum: 0,
				runningTotal: 0,
				runningCount: 0
			}
		});

		const parsedData = summaryCacheDataSchema.parse({
			...summaryQuery,
			monthlySummary,
			categories: await categoriesQuery,
			tags: await tagsQuery,
			bills: await billsQuery,
			budgets: await budgetsQuery,
			accounts: await accountsQuery
		});

		return parsedData;
	},
	list: async ({ db, filter }: { db: DBType; filter: JournalFilterSchemaInputType }) => {
		return journalList({ db, filter });
	},
	listWithCommonData: async ({
		db,
		filter
	}: {
		db: DBType;
		filter: JournalFilterSchemaInputType;
	}) => {
		const journalInformation = await journalActions.list({ db, filter });

		const accountId = getCommonData('accountId', journalInformation.data);
		const amount = getCommonData('amount', journalInformation.data);

		//Note that the following have "undefined" as this removes the null option which isn't relevant for this functionaliy. This helps the forms work correctly.
		const tagId = getCommonData('tagId', journalInformation.data) || undefined;
		const categoryId = getCommonData('categoryId', journalInformation.data) || undefined;
		const billId = getCommonData('billId', journalInformation.data) || undefined;
		const budgetId = getCommonData('budgetId', journalInformation.data) || undefined;
		const date = getCommonData('dateText', journalInformation.data);
		const description = getCommonData('description', journalInformation.data);
		const linked = getCommonData('linked', journalInformation.data);
		const reconciled = getCommonData('reconciled', journalInformation.data);
		const complete = getCommonData('complete', journalInformation.data);
		const dataChecked = getCommonData('dataChecked', journalInformation.data);
		const labelData = getCommonLabelData(journalInformation.data);

		return {
			journals: journalInformation,
			common: {
				accountId,
				amount,
				tagId,
				categoryId,
				billId,
				budgetId,
				date,
				description,
				linked,
				reconciled,
				complete,
				dataChecked,
				...labelData
			}
		};
	},
	createManyTransactionJournals: async ({
		db,
		journalEntries
	}: {
		db: DBType;
		journalEntries: CreateCombinedTransactionType[];
	}) => {
		let transactionIds: string[] = [];

		await db.transaction(async (db) => {
			const itemsForCreation = await Promise.all(
				journalEntries.map(async (journalEntry) => {
					return generateItemsForTransactionCreation(db, journalEntry);
				})
			);

			const transactions = itemsForCreation
				.map(({ transactions }) => transactions)
				.reduce((a, b) => [...a, ...b], []);

			transactionIds = transactions.map((trans) => trans.id);

			const journals = itemsForCreation
				.map(({ journals }) => journals)
				.reduce((a, b) => [...a, ...b], []);
			const labels = itemsForCreation
				.map(({ labels }) => labels)
				.reduce((a, b) => [...a, ...b], []);

			const transactionChunks = splitArrayIntoChunks(transactions, 5000);
			for (const chunk of transactionChunks) {
				await db.insert(transaction).values(chunk).execute();
			}

			const journalChunks = splitArrayIntoChunks(journals, 1000);
			for (const chunk of journalChunks) {
				await db.insert(journalEntry).values(chunk).execute();
			}

			const labelChunks = splitArrayIntoChunks(labels, 1000);
			for (const chunk of labelChunks) {
				await db.insert(labelsToJournals).values(chunk).execute();
			}
		});

		return transactionIds;
	},
	hardDeleteTransactions: async ({
		db,
		transactionIds
	}: {
		db: DBType;
		transactionIds: string[];
	}) => {
		await db.transaction(async (db) => {
			const journalsForDeletion = await db
				.select()
				.from(journalEntry)
				.where(inArray(journalEntry.transactionId, transactionIds))
				.execute();
			await db
				.delete(journalEntry)
				.where(inArray(journalEntry.transactionId, transactionIds))
				.execute();
			await db.delete(transaction).where(inArray(transaction.id, transactionIds)).execute();
			await db.delete(labelsToJournals).where(
				inArray(
					labelsToJournals.journalId,
					journalsForDeletion.map((item) => item.id)
				)
			);
		});
	},
	seed: async (db: DBType, count: number) => {
		const startTime = Date.now();
		const { data: assetLiabilityAccounts } = await accountActions.list({
			db,
			filter: { type: ['asset', 'liability'], allowUpdate: true, pageSize: 10000 }
		});
		const { data: incomeAccounts } = await accountActions.list({
			db,
			filter: { type: ['income'], allowUpdate: true, pageSize: 10000 }
		});
		const { data: expenseAccounts } = await accountActions.list({
			db,
			filter: { type: ['expense'], allowUpdate: true, pageSize: 10000 }
		});
		const { data: bills } = await tActions.bill.list({
			db,
			filter: { allowUpdate: true, pageSize: 10000 }
		});
		const { data: budgets } = await tActions.budget.list({
			db,
			filter: { allowUpdate: true, pageSize: 10000 }
		});
		const { data: categories } = await tActions.category.list({
			db,
			filter: { allowUpdate: true, pageSize: 10000 }
		});
		const { data: tags } = await tActions.tag.list({
			db,
			filter: { allowUpdate: true, pageSize: 10000 }
		});
		const { data: labels } = await tActions.label.list({
			db,
			filter: { allowUpdate: true, pageSize: 10000 }
		});
		const transactionsForCreation = Array(count)
			.fill(0)
			.map(() =>
				seedTransactionData({
					assetLiabilityIds: assetLiabilityAccounts.map(({ id }) => id),
					incomeIds: incomeAccounts.map(({ id }) => id),
					expenseIds: expenseAccounts.map(({ id }) => id),
					billIds: bills.map(({ id }) => id),
					budgetIds: budgets.map(({ id }) => id),
					categoryIds: categories.map(({ id }) => id),
					tagIds: tags.map(({ id }) => id),
					labelIds: labels.map(({ id }) => id)
				})
			);

		await db.transaction(async (db) => {
			await journalActions.createManyTransactionJournals({
				db,
				journalEntries: transactionsForCreation
			});
		});
		const endTime = Date.now();
		logging.info(`Seeding ${count} transactions took ${endTime - startTime}ms`);
	},
	markManyComplete: async ({
		db,
		journalFilter
	}: {
		db: DBType;
		journalFilter: JournalFilterSchemaInputType;
	}) => {
		const journals = await journalActions.list({ db, filter: journalFilter });

		await db.transaction(async (db) => {
			await Promise.all(
				journals.data.map((journal) => {
					return journalActions.markComplete(db, journal.id);
				})
			);
		});
	},
	markManyUncomplete: async ({
		db,
		journalFilter
	}: {
		db: DBType;
		journalFilter: JournalFilterSchemaInputType;
	}) => {
		const journals = await journalActions.list({ db, filter: journalFilter });

		await db.transaction(async (db) => {
			await Promise.all(
				journals.data.map((journal) => {
					return journalActions.markUncomplete(db, journal.id);
				})
			);
		});
	},
	markComplete: async (db: DBType, journalId: string) => {
		const journal = await db.query.journalEntry
			.findFirst({ where: eq(journalEntry.id, journalId) })
			.execute();
		if (!journal) return;
		const { transactionId } = journal;
		await db
			.update(journalEntry)
			.set({ complete: true, dataChecked: true, reconciled: true, ...updatedTime() })
			.where(eq(journalEntry.transactionId, transactionId))
			.execute();
	},
	markUncomplete: async (db: DBType, journalId: string) => {
		const journal = await db.query.journalEntry
			.findFirst({ where: eq(journalEntry.id, journalId) })
			.execute();
		if (!journal) return;
		const { transactionId } = journal;
		await db
			.update(journalEntry)
			.set({ complete: false, ...updatedTime() })
			.where(eq(journalEntry.transactionId, transactionId))
			.execute();
	},
	updateJournals: async ({
		db,
		filter,
		journalData
	}: {
		db: DBType;
		filter: JournalFilterSchemaInputType;
		journalData: UpdateJournalSchemaInputType;
	}) => {
		const processedData = updateJournalSchema.safeParse(journalData);

		if (!processedData.success) {
			console.log(JSON.stringify(processedData.error));
			throw new Error('Invalid Journal Update Data');
		}

		const processedFilter = journalFilterSchema.catch(defaultJournalFilter).parse(filter);
		// logging.info('Updating Journals - Filter : ', processedFilter);
		// logging.info('Updating Journals - New Data : ', processedData.data);
		const journals = await journalActions.list({ db, filter: processedFilter });

		if (journals.data.length === 0) return;

		const completedCount = journals.data.filter((journal) => journal.complete).length;

		if (completedCount > 0) throw new Error('Cannot update journals that are already complete');

		const linkedJournals = journals.data.filter((journal) => journal.linked);
		const unlinkedJournals = journals.data.filter((journal) => !journal.linked);
		const transactionIds = linkedJournals.map((item) => item.transactionId);
		const journalIds = unlinkedJournals.map((item) => item.id);
		const targetJournals = (
			await db
				.select({ id: journalEntry.id })
				.from(journalEntry)
				.where(
					or(
						journalIds.length > 0
							? inArray(journalEntry.id, journalIds)
							: eq(journalEntry.id, 'empty'),
						transactionIds.length > 0
							? inArray(journalEntry.transactionId, transactionIds)
							: eq(journalEntry.id, 'empty')
					)
				)
				.execute()
		).map((item) => item.id);

		await db.transaction(async (db) => {
			const tagId = handleLinkedItem({
				db,
				id: processedData.data.tagId,
				title: processedData.data.tagTitle,
				clear: processedData.data.tagClear,
				requireActive: true,
				createOrGetItem: tActions.tag.createOrGet
			});
			const categoryId = handleLinkedItem({
				db,
				id: processedData.data.categoryId,
				title: processedData.data.categoryTitle,
				clear: processedData.data.categoryClear,
				requireActive: true,
				createOrGetItem: tActions.category.createOrGet
			});
			const billId = handleLinkedItem({
				db,
				id: processedData.data.billId,
				title: processedData.data.billTitle,
				clear: processedData.data.billClear,
				requireActive: true,
				createOrGetItem: tActions.bill.createOrGet
			});
			const budgetId = handleLinkedItem({
				db,
				id: processedData.data.budgetId,
				title: processedData.data.budgetTitle,
				clear: processedData.data.budgetClear,
				requireActive: true,
				createOrGetItem: tActions.budget.createOrGet
			});

			const accountId = (
				await tActions.account.createOrGet({
					db,
					title: journalData.accountTitle || undefined,
					id: journalData.accountId || undefined,
					requireActive: true
				})
			)?.id;

			const otherAccountId = (
				await tActions.account.createOrGet({
					db,
					title: journalData.otherAccountTitle || undefined,
					id: journalData.otherAccountId || undefined,
					requireActive: true
				})
			)?.id;

			const targetDate = journalData.date ? expandDate(journalData.date) : {};

			if (linkedJournals.length > 0) {
				const transactionIds = linkedJournals.map((journal) => journal.transactionId);
				await db
					.update(journalEntry)
					.set({
						tagId: await tagId,
						categoryId: await categoryId,
						billId: await billId,
						budgetId: await budgetId,
						dataChecked: journalData.dataChecked,
						reconciled: journalData.reconciled,
						description: journalData.description,
						...targetDate,
						...updatedTime()
					})
					.where(inArray(journalEntry.transactionId, transactionIds))
					.execute();
			}

			if (unlinkedJournals.length > 0) {
				const journalIds = unlinkedJournals.map((journal) => journal.id);
				await db
					.update(journalEntry)
					.set({
						tagId: await tagId,
						categoryId: await categoryId,
						billId: await billId,
						budgetId: await budgetId,
						dataChecked: journalData.dataChecked,
						reconciled: journalData.reconciled,
						...targetDate,
						...updatedTime()
					})
					.where(inArray(journalEntry.id, journalIds));
			}
			if (accountId) {
				const journalIds = journals.data.map((journal) => journal.id);

				await db
					.update(journalEntry)
					.set({ accountId })
					.where(inArray(journalEntry.id, journalIds))
					.execute();
			}
			if (otherAccountId) {
				const transactions = journals.data.map((journal) => journal.transactionId);

				const otherJournals = await db.query.journalEntry.findMany({
					where: and(
						inArray(journalEntry.transactionId, transactions),
						not(
							inArray(
								journalEntry.id,
								journals.data.map((journal) => journal.id)
							)
						)
					),
					columns: {
						id: true,
						accountId: true,
						transactionId: true
					}
				});

				//Make sure there isn't any journals that will have more than one journal after the update.
				const transactionIds = otherJournals.map((journal) => journal.transactionId);
				const transactionJournalCount = transactionIds.map((transactionId) => {
					return otherJournals.filter((journal) => journal.transactionId === transactionId).length;
				});
				const numberWithMoreTHan1 = transactionJournalCount.filter((count) => count > 1).length;
				if (numberWithMoreTHan1 > 1)
					throw new Error(
						'Cannot update other account if there is a transaction with more than 2 journals'
					);

				const updatingJournalIds = otherJournals.map((journal) => journal.id);

				await db
					.update(journalEntry)
					.set({ accountId: otherAccountId })
					.where(inArray(journalEntry.id, updatingJournalIds))
					.execute();
			}

			if (journalData.amount !== undefined) {
				const journalIds = journals.data.map((journal) => journal.id);

				await db
					.update(journalEntry)
					.set({ amount: journalData.amount, ...updatedTime() })
					.where(
						and(
							inArray(journalEntry.id, journalIds),
							not(eq(journalEntry.amount, journalData.amount))
						)
					)
					.execute();

				//Get Transactions that have a non-zero combined total and update the one with the oldest update time.
				const transactionIds = journals.data.map((journal) => journal.transactionId);

				const transactionJournals = await db.query.transaction.findMany({
					where: inArray(transaction.id, transactionIds),
					columns: {
						id: true
					},
					with: {
						journals: {
							columns: {
								id: true,
								amount: true,
								updatedAt: true
							}
						}
					}
				});

				await Promise.all(
					transactionJournals.map(async (transaction) => {
						const total = transaction.journals.reduce((prev, current) => prev + current.amount, 0);

						if (total !== 0) {
							const journalToUpdate = transaction.journals.sort((a, b) =>
								a.updatedAt.toISOString().localeCompare(b.updatedAt.toISOString())
							)[0];
							await db
								.update(journalEntry)
								.set({ amount: journalToUpdate.amount - total, ...updatedTime() })
								.where(eq(journalEntry.id, journalToUpdate.id))
								.execute();
						}
					})
				);
			}

			const labelSetting: { id?: string; title?: string }[] = [
				...(journalData.labels ? journalData.labels.map((id) => ({ id })) : []),
				...(journalData.labelTitles ? journalData.labelTitles.map((title) => ({ title })) : [])
			];

			const labelAddition: { id?: string; title?: string }[] = [
				...(journalData.addLabels ? journalData.addLabels.map((id) => ({ id })) : []),
				...(journalData.addLabelTitles
					? journalData.addLabelTitles.map((title) => ({ title }))
					: [])
			];

			const labelSettingIds = await Promise.all(
				labelSetting.map(async (currentAdd) => {
					return tActions.label.createOrGet({ db, ...currentAdd, requireActive: true });
				})
			);

			const labelAdditionIds = await Promise.all(
				labelAddition.map(async (currentAdd) => {
					return tActions.label.createOrGet({ db, ...currentAdd, requireActive: true });
				})
			);

			const combinedLabels = [...labelSettingIds, ...labelAdditionIds];

			//Create Label Relationships for those to be added, as well as for those to be the only items
			if (combinedLabels.length > 0) {
				const itemsToCreate = targetJournals.reduce(
					(prev, currentJournalId) => {
						return [
							...prev,
							...combinedLabels.map((currentLabelId) => {
								return {
									id: nanoid(),
									labelId: currentLabelId,
									journalId: currentJournalId,
									...updatedTime(),
									createdAt: new Date()
								};
							})
						];
					},
					[] as {
						id: string;
						journalId: string;
						labelId: string;
						createdAt: Date;
						updatedAt: Date;
					}[]
				);

				await db
					.insert(labelsToJournals)
					.values(itemsToCreate)
					.onConflictDoNothing({ target: [labelsToJournals.journalId, labelsToJournals.labelId] })
					.execute();
			}

			//Remove the labels that should be removed
			if (journalData.removeLabels && journalData.removeLabels.length > 0) {
				await db
					.delete(labelsToJournals)
					.where(
						and(
							inArray(labelsToJournals.labelId, journalData.removeLabels),
							inArray(labelsToJournals.journalId, targetJournals)
						)
					);
			}

			//When a specific set of labels are specified, then remove the ones that aren't in that list
			if (labelSettingIds.length > 0) {
				await db
					.delete(labelsToJournals)
					.where(
						and(
							inArray(labelsToJournals.journalId, targetJournals),
							not(inArray(labelsToJournals.labelId, labelSettingIds))
						)
					)
					.execute();
			}
		});
	},
	cloneJournals: async ({
		db,
		filter,
		journalData
	}: {
		db: DBType;
		filter: JournalFilterSchemaInputType;
		journalData: UpdateJournalSchemaInputType;
	}) => {
		const processedData = updateJournalSchema.safeParse(journalData);

		if (!processedData.success) {
			console.log(JSON.stringify(processedData.error));
			throw new Error('Inavalid Journal Update Data');
		}

		const processedFilter = journalFilterSchema.parse(filter);
		const journals = await journalActions.list({ db, filter: processedFilter });

		if (journals.data.length === 0) return;

		const originalTransactionIds = [
			...new Set(journals.data.map((journal) => journal.transactionId))
		];

		const transactions = await db.query.transaction
			.findMany({
				where: inArray(transaction.id, originalTransactionIds),
				with: {
					journals: { with: { labels: true } }
				}
			})
			.execute();

		const transactionsForCreation = transactions.map((transaction) => {
			const journals: CreateCombinedTransactionType = transaction.journals.map((journal) => ({
				date: journal.date.toISOString().slice(0, 10),
				amount: journal.amount,
				description: journal.description,
				accountId: journal.accountId,
				tagId: journal.tagId || undefined,
				billId: journal.billId || undefined,
				budgetId: journal.budgetId || undefined,
				categoryId: journal.categoryId || undefined,
				labels: journal.labels.map((label) => label.labelId)
			}));

			return journals;
		});

		let transactionIds: string[] = [];

		await db.transaction(async (db) => {
			transactionIds = await journalActions.createManyTransactionJournals({
				db,
				journalEntries: transactionsForCreation
			});

			const createdItems = await journalActions.list({
				db,
				filter: {
					transactionIdArray: transactionIds,
					page: 0,
					pageSize: 1000000
				}
			});

			await journalActions.updateJournals({
				db,
				filter: {
					transactionIdArray: transactionIds,
					page: 0,
					pageSize: 1000000
				},
				journalData: processedData.data
			});
		});

		return transactionIds;
	}
};

export type JournalSummaryType = Awaited<ReturnType<(typeof journalActions)['summary']>>;
