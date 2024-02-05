import {
	type CreateCombinedTransactionType,
	journalFilterSchema,
	defaultJournalFilter,
	type JournalFilterSchemaInputType,
	type UpdateJournalSchemaInputType,
	updateJournalSchema,
	type CreateSimpleTransactionType,
	createSimpleTransactionSchema,
	type CloneJournalUpdateSchemaType,
	cloneJournalUpdateSchema
} from '$lib/schema/journalSchema';
import { eq, and, inArray, not, or } from 'drizzle-orm';
import type { DBType } from '../db';
import { journalEntry, transaction, labelsToJournals } from '../postgres/schema';
import { updatedTime } from './helpers/misc/updatedTime';
import { expandDate } from './helpers/journal/expandDate';
import { accountActions } from './accountActions';
import { tActions } from './tActions';
import { seedTransactionData } from './helpers/seed/seedTransactionData';
import { logging } from '$lib/server/logging';
import { handleLinkedItem } from './helpers/journal/handleLinkedItem';
import {
	generateItemsForTransactionCreation,
	getCachedData
} from './helpers/journal/generateItemsForTransactionCreation';
import { splitArrayIntoChunks } from './helpers/misc/splitArrayIntoChunks';
import { nanoid } from 'nanoid';
import { simpleSchemaToCombinedSchema } from './helpers/journal/simpleSchemaToCombinedSchema';
import { updateManyTransferInfo } from './helpers/journal/updateTransactionTransfer';
import { materializedViewActions } from './materializedViewActions';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';

export const journalActions = {
	createFromSimpleTransaction: async ({
		db,
		transaction
	}: {
		db: DBType;
		transaction: CreateSimpleTransactionType;
	}) => {
		const processedTransaction = createSimpleTransactionSchema.safeParse(transaction);

		if (!processedTransaction.success) {
			throw new Error('Invalid Transaction Data');
		}

		const combinedTransaction = simpleSchemaToCombinedSchema(processedTransaction.data);

		const createdTransaction = await journalActions.createManyTransactionJournals({
			db,
			journalEntries: [combinedTransaction]
		});

		return createdTransaction;
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
			const cachedData = await getCachedData({ db, count: journalEntries.length });
			const itemsForCreation = await Promise.all(
				journalEntries.map(async (journalEntry) => {
					return generateItemsForTransactionCreation({ db, data: journalEntry, cachedData });
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

			const transactionChunks = splitArrayIntoChunks(transactions, 2000);
			for (const chunk of transactionChunks) {
				await db.insert(transaction).values(chunk).execute();
			}

			const journalChunks = splitArrayIntoChunks(journals, 2000);
			for (const chunk of journalChunks) {
				await db.insert(journalEntry).values(chunk).execute();
			}

			const labelChunks = splitArrayIntoChunks(labels, 2000);
			for (const chunk of labelChunks) {
				await db.insert(labelsToJournals).values(chunk).execute();
			}

			await updateManyTransferInfo({ db, transactionIds });
		});
		await materializedViewActions.setRefreshRequired(db);

		return transactionIds;
	},
	hardDeleteTransactions: async ({
		db,
		transactionIds
	}: {
		db: DBType;
		transactionIds: string[];
	}) => {
		if (transactionIds.length === 0) return;
		await db.transaction(async (db) => {
			const splitTransactionList = splitArrayIntoChunks(transactionIds, 500);

			await Promise.all(
				splitTransactionList.map(async (currentTransactionIds) => {
					const journalsForDeletion = await db
						.select()
						.from(journalEntry)
						.where(inArray(journalEntry.transactionId, currentTransactionIds))
						.execute();
					await db
						.delete(journalEntry)
						.where(inArray(journalEntry.transactionId, currentTransactionIds))
						.execute();
					await db
						.delete(transaction)
						.where(inArray(transaction.id, currentTransactionIds))
						.execute();
					await db.delete(labelsToJournals).where(
						inArray(
							labelsToJournals.journalId,
							journalsForDeletion.map((item) => item.id)
						)
					);
				})
			);
		});
		await materializedViewActions.setRefreshRequired(db);
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
		const journals = await tActions.journalView.list({ db, filter: journalFilter });

		await db.transaction(async (db) => {
			await Promise.all(
				journals.data.map((journal) => {
					return journalActions.markComplete(db, journal.id);
				})
			);
		});
		await materializedViewActions.setRefreshRequired(db);
	},
	markManyUncomplete: async ({
		db,
		journalFilter
	}: {
		db: DBType;
		journalFilter: JournalFilterSchemaInputType;
	}) => {
		const journals = await tActions.journalView.list({ db, filter: journalFilter });

		await db.transaction(async (db) => {
			await Promise.all(
				journals.data.map((journal) => {
					return journalActions.markUncomplete(db, journal.id);
				})
			);
		});
		await materializedViewActions.setRefreshRequired(db);
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
		await materializedViewActions.setRefreshRequired(db);
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
		await materializedViewActions.setRefreshRequired(db);
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
			logging.error('Invalid Journal Update Data', JSON.stringify(processedData.error));
			throw new Error('Invalid Journal Update Data');
		}

		const processedFilter = journalFilterSchema.catch(defaultJournalFilter()).parse(filter);
		const journals = await tActions.journalView.list({ db, filter: processedFilter });

		if (journals.data.length === 0) return;

		const completedCount = journals.data.filter((journal) => journal.complete).length;

		if (completedCount > 0) throw new Error('Cannot update journals that are already complete');

		const linkedJournals = journals.data.filter((journal) => journal.linked);
		const unlinkedJournals = journals.data.filter((journal) => !journal.linked);
		const linkedTransactionIds = filterNullUndefinedAndDuplicates(
			linkedJournals.map((item) => item.transactionId)
		);
		const allTransactionIds = filterNullUndefinedAndDuplicates(
			journals.data.map((item) => item.transactionId)
		);

		const journalIds = [...new Set(unlinkedJournals.map((item) => item.id))];
		const targetJournals = (
			await db
				.select({ id: journalEntry.id })
				.from(journalEntry)
				.where(
					or(
						journalIds.length > 0
							? inArray(journalEntry.id, journalIds)
							: eq(journalEntry.id, 'empty'),
						linkedTransactionIds.length > 0
							? inArray(journalEntry.transactionId, linkedTransactionIds)
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

			const complete =
				journalData.setComplete === true
					? true
					: journalData.clearComplete === true
						? false
						: undefined;
			const reconciled =
				complete === true
					? true
					: journalData.setReconciled === true
						? true
						: journalData.clearReconciled === true
							? false
							: undefined;
			const dataChecked =
				complete === true
					? true
					: journalData.setDataChecked === true
						? true
						: journalData.clearDataChecked === true
							? false
							: undefined;

			if (linkedJournals.length > 0) {
				await db
					.update(journalEntry)
					.set({
						tagId: await tagId,
						categoryId: await categoryId,
						billId: await billId,
						budgetId: await budgetId,
						complete,
						dataChecked,
						reconciled,
						description: journalData.description,
						...targetDate,
						...updatedTime()
					})
					.where(inArray(journalEntry.transactionId, linkedTransactionIds))
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
						complete,
						dataChecked,
						reconciled,
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
				const numberWithMoreThan1 = journals.data.reduce(
					(prev, current) => (current.otherJournals.length > 1 ? prev + 1 : prev),
					0
				);
				if (numberWithMoreThan1 > 0)
					throw new Error(
						'Cannot update other account if there is a transaction with more than 2 journals'
					);

				const updatingJournalIds = journals.data.reduce((prev, current) => {
					return [...prev, ...current.otherJournals.map((item) => item.id)];
				}, [] as string[]);

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
				const transactionIds = filterNullUndefinedAndDuplicates(
					journals.data.map((journal) => journal.transactionId)
				);

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
								new Date(a.updatedAt)
									.toISOString()
									.localeCompare(new Date(b.updatedAt).toISOString())
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

			await updateManyTransferInfo({ db, transactionIds: allTransactionIds });
		});
		await materializedViewActions.setRefreshRequired(db);

		return targetJournals;
	},
	cloneJournals: async ({
		db,
		filter,
		journalData
	}: {
		db: DBType;
		filter: JournalFilterSchemaInputType;
		journalData: CloneJournalUpdateSchemaType;
	}) => {
		const processedData = cloneJournalUpdateSchema.safeParse(journalData);

		if (!processedData.success) {
			logging.error('Invalid Journal Update Data', JSON.stringify(processedData.error));
			throw new Error('Inavalid Journal Update Data');
		}

		const processedFilter = journalFilterSchema.parse(filter);
		const journals = await tActions.journalView.list({ db, filter: processedFilter });

		if (journals.data.length === 0) return;

		const originalTransactionIds = filterNullUndefinedAndDuplicates(
			journals.data.map((journal) => journal.transactionId)
		);

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

			const {
				fromAccountId,
				fromAccountTitle,
				toAccountId,
				toAccountTitle,
				fromAmount,
				toAmount,
				...restProcessedData
			} = processedData.data;

			await journalActions.updateJournals({
				db,
				filter: {
					transactionIdArray: transactionIds,
					page: 0,
					pageSize: 1000000
				},
				journalData: restProcessedData
			});

			if (
				fromAccountId !== undefined ||
				fromAccountTitle !== undefined ||
				fromAmount !== undefined
			) {
				await journalActions.updateJournals({
					db,
					filter: {
						transactionIdArray: transactionIds,
						maxAmount: 0,
						page: 0,
						pageSize: 1000000
					},
					journalData: {
						accountId: fromAccountId,
						accountTitle: fromAccountTitle,
						amount: fromAmount
					}
				});
			}
			if (toAccountId !== undefined || toAccountTitle !== undefined || toAmount !== undefined) {
				await journalActions.updateJournals({
					db,
					filter: {
						transactionIdArray: transactionIds,
						minAmount: 0,
						page: 0,
						pageSize: 1000000
					},
					journalData: {
						accountId: toAccountId,
						accountTitle: toAccountTitle,
						amount: toAmount
					}
				});
			}
		});

		return transactionIds;
	}
};

export type JournalSummaryType = Awaited<ReturnType<(typeof tActions.journalView)['summary']>>;
