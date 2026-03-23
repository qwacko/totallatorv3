import { and, count, desc, eq, not, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { SpanStatusCode, trace } from '@opentelemetry/api';

import { getContextDB, runInTransactionWithLogging } from '@totallator/context';
import type { DBType } from '@totallator/database';
import { journalEntry, labelsToJournals, transaction } from '@totallator/database';
import {
	cloneJournalUpdateSchema,
	type CloneJournalUpdateSchemaType,
	type CreateCombinedTransactionType,
	createSimpleTransactionSchema,
	type CreateSimpleTransactionType,
	defaultJournalFilter,
	journalFilterSchema,
	type JournalFilterSchemaInputType,
	updateJournalSchema,
	type UpdateJournalSchemaInputType
} from '@totallator/shared';

import { getLogger } from '../logger';
import { dbExecuteLogger } from '../server/db/dbLogger';

import { filterNullUndefinedAndDuplicates } from '../helpers/filterNullUndefinedAndDuplicates';
import { accountActions } from './accountActions';
import { billActions } from './billActions';
import { budgetActions } from './budgetActions';
import { categoryActions } from './categoryActions';
import { accountGetById } from './helpers/account/accountGetById';
import { checkUpdateLabelsOnly } from './helpers/journal/checkUpdateLabelsOnly';
import { expandDate } from './helpers/journal/expandDate';
import {
	generateItemsForTransactionCreation,
	getCachedData
} from './helpers/journal/generateItemsForTransactionCreation';
import { handleLinkedItem } from './helpers/journal/handleLinkedItem';
import { journalMaterialisedList } from './helpers/journal/journalList';
import { simpleSchemaToCombinedSchema } from './helpers/journal/simpleSchemaToCombinedSchema';
import { updateManyTransferInfo } from './helpers/journal/updateTransactionTransfer';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { splitArrayIntoChunks } from './helpers/misc/splitArrayIntoChunks';
import { updatedTime } from './helpers/misc/updatedTime';
import { seedTransactionData } from './helpers/seed/seedTransactionData';
import { labelActions } from './labelActions';
import { materializedViewActions } from './materializedViewActions';
import { tagActions } from './tagActions';
import {
	buildTransactionSnapshots,
	transactionChangeActions,
	type AuditSourceInput
} from './transactionChangeActions';

const journalTracer = trace.getTracer('@totallator/business-logic/journals');

/**
 * Journal and transaction orchestration.
 *
 * This module owns transaction/journal creation, bulk mutation, completion
 * state changes, cloning, transfer reconciliation, and audit snapshot
 * generation.
 */
export const journalActions = {
	/**
	 * Validates a simplified transaction payload, expands it into the internal
	 * combined transaction schema, and persists the resulting journals and
	 * transactions.
	 */
	createFromSimpleTransaction: async ({
		transaction
	}: {
		transaction: CreateSimpleTransactionType;
	}): Promise<string[]> => {
		const startTime = Date.now();
		getLogger('journals').info({
			code: 'JOURNAL_010',
			title: 'Starting simple transaction creation',
			transaction: transaction,
			amount: transaction.amount
		});

		const processedTransaction = createSimpleTransactionSchema.safeParse(transaction);

		if (!processedTransaction.success) {
			getLogger('journals').error({
				code: 'JOURNAL_011',
				title: 'Invalid transaction data provided',
				error: processedTransaction.error,
				transaction
			});
			throw new Error('Invalid Transaction Data');
		}

		getLogger('journals').debug({
			code: 'JOURNAL_012',
			title: 'Transaction validation successful, converting to combined schema'
		});

		const combinedTransaction = simpleSchemaToCombinedSchema(processedTransaction.data);

		const createdTransaction = await journalActions.createManyTransactionJournals({
			journalEntries: [combinedTransaction],
			isImport: false // This is manual creation
		});

		const duration = Date.now() - startTime;
		getLogger('journals').info({
			code: 'JOURNAL_013',
			title: 'Simple transaction creation completed',
			duration,
			transactionIds: createdTransaction
		});

		return createdTransaction;
	},
	/**
	 * Creates one or more combined transaction/journal payloads in a single
	 * workflow. This performs batched inserts, transfer-info reconciliation, and
	 * transaction snapshot/audit recording.
	 */
	createManyTransactionJournals: async ({
		journalEntries,
		isImport = false,
		auditSource
	}: {
		journalEntries: CreateCombinedTransactionType[];
		isImport?: boolean;
		auditSource?: AuditSourceInput;
	}): Promise<string[]> => {
		const startTime = Date.now();
		let transactionIds: string[] = [];

		getLogger('journals').info({
			code: 'JOURNAL_014',
			title: 'Starting batch transaction journal creation',
			entryCount: journalEntries.length,
			isImport
		});

		const executeTransactionWork = async (dbContext: DBType) => {
			getLogger('journals').debug({
				code: 'JOURNAL_015',
				title: 'Fetching cached data for transaction creation',
				entryCount: journalEntries.length
			});

			const cachedData = await getCachedData({
				db: dbContext,
				count: journalEntries.length
			});

			getLogger('journals').debug({
				code: 'JOURNAL_016',
				title: 'Generating items for transaction creation',
				entryCount: journalEntries.length
			});

			const itemsForCreation = await Promise.all(
				journalEntries.map(async (journalEntry, index) => {
					const result = await generateItemsForTransactionCreation({
						db: dbContext,
						data: journalEntry,
						cachedData,
						isImport
					});

					if (index % 100 === 0 && index > 0) {
						getLogger('journals').debug({
							code: 'JOURNAL_017',
							title: 'Transaction generation progress',
							processed: index + 1,
							total: journalEntries.length
						});
					}

					return result;
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

			getLogger('journals').info({
				code: 'JOURNAL_018',
				title: 'Items prepared for database insertion',
				transactionCount: transactions.length,
				journalCount: journals.length,
				labelCount: labels.length
			});

			const transactionChunks = splitArrayIntoChunks(transactions, 2000);
			getLogger('journals').debug({
				code: 'JOURNAL_019',
				title: 'Inserting transactions in chunks',
				chunkCount: transactionChunks.length,
				totalTransactions: transactions.length
			});

			for (const [index, chunk] of transactionChunks.entries()) {
				await dbExecuteLogger(
					dbContext.insert(transaction).values(chunk),
					'Transaction Journals - Create Many - Transaction'
				);
				getLogger('journals').debug({
					code: 'JOURNAL_020',
					title: 'Transaction chunk inserted',
					chunkIndex: index + 1,
					chunkSize: chunk.length,
					totalChunks: transactionChunks.length
				});
			}

			const journalChunks = splitArrayIntoChunks(journals, 2000);
			getLogger('journals').debug({
				code: 'JOURNAL_021',
				title: 'Inserting journals in chunks',
				chunkCount: journalChunks.length,
				totalJournals: journals.length
			});

			for (const [index, chunk] of journalChunks.entries()) {
				await dbExecuteLogger(
					dbContext.insert(journalEntry).values(chunk),
					'Transaction Journals - Create Many - Journal'
				);
				getLogger('journals').debug({
					code: 'JOURNAL_022',
					title: 'Journal chunk inserted',
					chunkIndex: index + 1,
					chunkSize: chunk.length,
					totalChunks: journalChunks.length
				});
			}

			const labelChunks = splitArrayIntoChunks(labels, 2000);
			if (labels.length > 0) {
				getLogger('journals').debug({
					code: 'JOURNAL_023',
					title: 'Inserting labels in chunks',
					chunkCount: labelChunks.length,
					totalLabels: labels.length
				});

				for (const [index, chunk] of labelChunks.entries()) {
					await dbExecuteLogger(
						dbContext.insert(labelsToJournals).values(chunk),
						'Transaction Journals - Create Many - Labels'
					);
					getLogger('journals').debug({
						code: 'JOURNAL_024',
						title: 'Label chunk inserted',
						chunkIndex: index + 1,
						chunkSize: chunk.length,
						totalChunks: labelChunks.length
					});
				}
			}

			getLogger('journals').debug({
				code: 'JOURNAL_025',
				title: 'Updating transfer information',
				transactionCount: transactionIds.length
			});

			await updateManyTransferInfo({ db: dbContext, transactionIds });
			const afterSnapshots = await buildTransactionSnapshots({
				db: dbContext,
				transactionIds
			});
			await transactionChangeActions.recordChanges({
				db: dbContext,
				transactionIds,
				changeType: 'create',
				afterSnapshots,
				source: auditSource
			});
		};

		// Create a new transaction
		await runInTransactionWithLogging('Create Many Transaction Journals', async (trx) => {
			await executeTransactionWork(trx);
		});

		getLogger('journals').debug({
			code: 'JOURNAL_026',
			title: 'Setting materialized view refresh required'
		});

		await materializedViewActions.setRefreshRequired();

		const duration = Date.now() - startTime;
		getLogger('journals').info({
			code: 'JOURNAL_027',
			title: 'Batch transaction journal creation completed',
			duration,
			entryCount: journalEntries.length,
			transactionIds: transactionIds.length,
			isImport
		});

		return transactionIds;
	},
	hardDeleteTransactions: async ({
		transactionIds,
		auditSource
	}: {
		transactionIds: string[];
		auditSource?: AuditSourceInput;
	}): Promise<void> => {
		if (transactionIds.length === 0) {
			getLogger('journals').warn({
				code: 'JOURNAL_028',
				title: 'Hard delete called with empty transaction list'
			});
			return;
		}

		getLogger('journals').info({
			code: 'JOURNAL_029',
			title: 'Starting hard delete of transactions',
			transactionCount: transactionIds.length
		});

		await runInTransactionWithLogging('Hard Delete Transactions', async () => {
			const db = getContextDB();
			const splitTransactionList = splitArrayIntoChunks(transactionIds, 500);

			getLogger('journals').debug({
				code: 'JOURNAL_030',
				title: 'Processing deletions in chunks',
				chunkCount: splitTransactionList.length,
				chunkSize: 500
			});

			await Promise.all(
				splitTransactionList.map(async (currentTransactionIds, chunkIndex) => {
					const beforeSnapshots = await buildTransactionSnapshots({
						db,
						transactionIds: currentTransactionIds
					});
					getLogger('journals').debug({
						code: 'JOURNAL_031',
						title: 'Processing deletion chunk',
						chunkIndex: chunkIndex + 1,
						chunkSize: currentTransactionIds.length,
						totalChunks: splitTransactionList.length
					});

					const journalsForDeletion = await dbExecuteLogger(
						db
							.select()
							.from(journalEntry)
							.where(inArrayWrapped(journalEntry.transactionId, currentTransactionIds)),
						'Transaction Journals - Hard Delete Transactions - Select Journals'
					);

					getLogger('journals').debug({
						code: 'JOURNAL_032',
						title: 'Found journals for deletion',
						journalCount: journalsForDeletion.length,
						chunkIndex: chunkIndex + 1
					});

					await dbExecuteLogger(
						db
							.delete(journalEntry)
							.where(inArrayWrapped(journalEntry.transactionId, currentTransactionIds)),
						'Transaction Journals - Hard Delete Transactions - Delete Journals'
					);
					await dbExecuteLogger(
						db.delete(transaction).where(inArrayWrapped(transaction.id, currentTransactionIds)),
						'Transaction Journals - Hard Delete Transactions - Delete Transactions'
					);
					await dbExecuteLogger(
						db.delete(labelsToJournals).where(
							inArrayWrapped(
								labelsToJournals.journalId,
								journalsForDeletion.map((item) => item.id)
							)
						),
						'Transaction Journals - Hard Delete Transactions - Delete Labels'
					);
					await transactionChangeActions.recordChanges({
						db,
						transactionIds: currentTransactionIds,
						changeType: 'delete',
						beforeSnapshots,
						source: auditSource
					});

					getLogger('journals').debug({
						code: 'JOURNAL_033',
						title: 'Deletion chunk completed',
						chunkIndex: chunkIndex + 1,
						deletedTransactions: currentTransactionIds.length,
						deletedJournals: journalsForDeletion.length
					});
				})
			);
		});

		getLogger('journals').info({
			code: 'JOURNAL_034',
			title: 'Hard delete transactions completed',
			transactionCount: transactionIds.length
		});

		await materializedViewActions.setRefreshRequired();
	},
	seed: async (count: number): Promise<void> => {
		const startTime = Date.now();

		getLogger('journals').info({
			code: 'JOURNAL_035',
			title: 'Starting transaction seeding process',
			count
		});

		getLogger('journals').debug({
			code: 'JOURNAL_036',
			title: 'Fetching reference data for seeding'
		});

		const { data: assetLiabilityAccounts } = await accountActions.list({
			filter: {
				type: ['asset', 'liability'],
				allowUpdate: true,
				pageSize: 10000
			}
		});
		const { data: incomeAccounts } = await accountActions.list({
			filter: { type: ['income'], allowUpdate: true, pageSize: 10000 }
		});
		const { data: expenseAccounts } = await accountActions.list({
			filter: { type: ['expense'], allowUpdate: true, pageSize: 10000 }
		});
		const { data: bills } = await billActions.list({
			filter: { allowUpdate: true, pageSize: 10000 }
		});
		const { data: budgets } = await budgetActions.list({
			filter: { allowUpdate: true, pageSize: 10000 }
		});
		const { data: categories } = await categoryActions.list({
			filter: { allowUpdate: true, pageSize: 10000 }
		});
		const { data: tags } = await tagActions.list({
			filter: { allowUpdate: true, pageSize: 10000 }
		});
		const { data: labels } = await labelActions.list({
			filter: { allowUpdate: true, pageSize: 10000 }
		});

		getLogger('journals').info({
			code: 'JOURNAL_037',
			title: 'Reference data fetched for seeding',
			assetLiabilityCount: assetLiabilityAccounts.length,
			incomeCount: incomeAccounts.length,
			expenseCount: expenseAccounts.length,
			billCount: bills.length,
			budgetCount: budgets.length,
			categoryCount: categories.length,
			tagCount: tags.length,
			labelCount: labels.length
		});

		getLogger('journals').debug({
			code: 'JOURNAL_038',
			title: 'Generating seed transaction data',
			count
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

		await runInTransactionWithLogging('Seed Transactions', async () => {
			await journalActions.createManyTransactionJournals({
				journalEntries: transactionsForCreation,
				isImport: false // Seed data is not considered an import
			});
		});
		const endTime = Date.now();
		const duration = endTime - startTime;
		getLogger('journals').info({
			code: 'JOURNAL_002',
			title: `Seeding ${count} transactions took ${duration}ms`,
			count,
			duration
		});
	},
	markManyComplete: async ({
		journalFilter
	}: {
		journalFilter: JournalFilterSchemaInputType;
	}): Promise<void> => {
		const db = getContextDB();

		getLogger('journals').info({
			code: 'JOURNAL_040',
			title: 'Starting mark many journals complete',
			filter: journalFilter
		});

		const journals = await journalMaterialisedList({
			filter: journalFilter,
			db
		});

		getLogger('journals').info({
			code: 'JOURNAL_041',
			title: 'Found journals to mark complete',
			journalCount: journals.data.length
		});

		await runInTransactionWithLogging('Mark Many Journals Complete', async () => {
			await Promise.all(
				journals.data.map((journal, index) => {
					if (index % 50 === 0 && index > 0) {
						getLogger('journals').debug({
							code: 'JOURNAL_042',
							title: 'Mark complete progress',
							processed: index,
							total: journals.data.length
						});
					}
					return journalActions.markComplete(journal.id);
				})
			);
		});

		getLogger('journals').info({
			code: 'JOURNAL_043',
			title: 'Mark many journals complete finished',
			journalCount: journals.data.length
		});

		await materializedViewActions.setRefreshRequired();
	},
	markManyUncomplete: async ({
		journalFilter
	}: {
		journalFilter: JournalFilterSchemaInputType;
	}): Promise<void> => {
		const db = getContextDB();

		getLogger('journals').info({
			code: 'JOURNAL_044',
			title: 'Starting mark many journals uncomplete',
			filter: journalFilter
		});

		const journals = await journalMaterialisedList({
			filter: journalFilter,
			db
		});

		getLogger('journals').info({
			code: 'JOURNAL_045',
			title: 'Found journals to mark uncomplete',
			journalCount: journals.data.length
		});

		await runInTransactionWithLogging('Mark Many Journals Incomplete', async () => {
			await Promise.all(
				journals.data.map((journal, index) => {
					if (index % 50 === 0 && index > 0) {
						getLogger('journals').debug({
							code: 'JOURNAL_046',
							title: 'Mark uncomplete progress',
							processed: index,
							total: journals.data.length
						});
					}
					return journalActions.markUncomplete(journal.id);
				})
			);
		});

		getLogger('journals').info({
			code: 'JOURNAL_047',
			title: 'Mark many journals uncomplete finished',
			journalCount: journals.data.length
		});

		await materializedViewActions.setRefreshRequired();
	},
	markComplete: async (journalId: string): Promise<void> => {
		const db = getContextDB();
		const journal = await dbExecuteLogger(
			db.query.journalEntry.findFirst({
				where: eq(journalEntry.id, journalId)
			}),
			'Transaction Journals - Mark Complete - Find Journal'
		);
		if (!journal) return;
		const { transactionId } = journal;
		await dbExecuteLogger(
			db
				.update(journalEntry)
				.set({
					complete: true,
					dataChecked: true,
					reconciled: true,
					...updatedTime()
				})
				.where(eq(journalEntry.transactionId, transactionId)),
			'Transaction Journals - Mark Complete - Update Journal'
		);
		await materializedViewActions.setRefreshRequired();
	},
	markUncomplete: async (journalId: string): Promise<void> => {
		const db = getContextDB();
		const journal = await dbExecuteLogger(
			db.query.journalEntry.findFirst({
				where: eq(journalEntry.id, journalId)
			}),
			'Transaction Journals - Mark Uncomplete - Find Journal'
		);
		if (!journal) return;
		const { transactionId } = journal;
		await dbExecuteLogger(
			db
				.update(journalEntry)
				.set({ complete: false, ...updatedTime() })
				.where(eq(journalEntry.transactionId, transactionId)),
			'Transaction Journals - Mark Uncomplete - Update Journal'
		);
		await materializedViewActions.setRefreshRequired();
	},
	/**
	 * Main bulk journal mutation entrypoint.
	 *
	 * Depending on the payload, this can perform label-only updates or broader
	 * journal and transaction edits, reconcile linked entities, refresh
	 * materialized views, and emit audit history.
	 */
	updateJournals: async ({
		filter,
		journalData,
		auditSource
	}: {
		filter: JournalFilterSchemaInputType;
		journalData: UpdateJournalSchemaInputType;
		auditSource?: AuditSourceInput;
	}): Promise<undefined | string[]> => {
		return await journalTracer.startActiveSpan(
			'journals.update',
			async (span) => {
				try {
					const db = getContextDB();
					const processedData = updateJournalSchema.safeParse(journalData);

					if (!processedData.success) {
						getLogger('journals').error({
							code: 'JOURNAL_003',
							title: 'Invalid Journal Update Data',
							error: processedData.error
						});
						span.addEvent('journals.update.invalid-data');
						throw new Error('Invalid Journal Update Data');
					}

					span.setAttribute(
						'journals.update.has_date',
						processedData.data.date ? true : false
					);
					span.setAttribute(
						'journals.update.has_description',
						processedData.data.description ? true : false
					);
					span.setAttribute(
						'journals.update.label_title_count',
						processedData.data.labelTitles?.length || 0
					);
					span.setAttribute(
						'journals.update.add_label_title_count',
						processedData.data.addLabelTitles?.length || 0
					);

					const processedFilter = journalFilterSchema.catch(defaultJournalFilter()).parse(filter);
					const journals = await journalMaterialisedList({
						filter: processedFilter,
						db
					});

					span.setAttribute('journals.update.matched_count', journals.data.length);
					span.addEvent('journals.update.matched-journals', {
						'journals.update.matched_count': journals.data.length,
						'journals.update.sample_ids': journals.data
							.slice(0, 5)
							.map((journal) => journal.id)
							.join(',')
					});

					if (journals.data.length === 0) {
						span.addEvent('journals.update.no-matches');
						span.setStatus({ code: SpanStatusCode.OK });
						return undefined;
					}

					const completedCount = journals.data.filter((journal) => journal.complete).length;
					span.setAttribute('journals.update.complete_match_count', completedCount);

					if (completedCount > 0) {
						const updatingLabelsOnly = checkUpdateLabelsOnly(processedData.data);
						span.setAttribute('journals.update.labels_only', updatingLabelsOnly);

						if (!updatingLabelsOnly) {
							getLogger('journals').error({
								code: 'JOURNAL_004',
								title: 'Cannot update journals that are already complete',
								filter: processedFilter,
								data: processedData.data
							});
							span.addEvent('journals.update.complete-journals-blocked');
							span.setStatus({
								code: SpanStatusCode.ERROR,
								message: 'Cannot update complete journals unless updating labels only'
							});
							return undefined;
						}
					}

					const linkedJournals = journals.data.filter((journal) => journal.linked);
					const unlinkedJournals = journals.data.filter((journal) => !journal.linked);
					const linkedTransactionIds = filterNullUndefinedAndDuplicates(
						linkedJournals.map((item) => item.transactionId)
					);
					const allTransactionIds = filterNullUndefinedAndDuplicates(
						journals.data.map((item) => item.transactionId)
					);
					span.setAttribute('journals.update.linked_match_count', linkedJournals.length);
					span.setAttribute('journals.update.unlinked_match_count', unlinkedJournals.length);
					span.addEvent('journals.update.linked-expansion', {
						'journals.update.linked_transaction_count': linkedTransactionIds.length,
						'journals.update.all_transaction_count': allTransactionIds.length
					});

					const journalIds = [...new Set(unlinkedJournals.map((item) => item.id))];
					const targetJournals = (
						await dbExecuteLogger(
							db
								.select({ id: journalEntry.id })
								.from(journalEntry)
								.where(
									or(
										inArrayWrapped(journalEntry.id, journalIds),
										inArrayWrapped(journalEntry.transactionId, linkedTransactionIds)
									)
								),
							'Transaction Journals - Update Journals - Select Journals'
						)
					).map((item) => item.id);
					span.setAttribute('journals.update.target_journal_count', targetJournals.length);
					span.addEvent('journals.update.target-journals-selected', {
						'journals.update.target_journal_count': targetJournals.length,
						'journals.update.target_sample_ids': targetJournals.slice(0, 5).join(',')
					});
					span.addEvent('journals.update.requested-mutations', {
						'journals.update.requested_description': processedData.data.description ? true : false,
						'journals.update.requested_date': processedData.data.date ? true : false,
						'journals.update.requested_amount':
							processedData.data.amount !== undefined && processedData.data.amount !== null,
						'journals.update.requested_account': Boolean(
							processedData.data.accountId || processedData.data.accountTitle
						),
						'journals.update.requested_other_account': Boolean(
							processedData.data.otherAccountId || processedData.data.otherAccountTitle
						),
						'journals.update.requested_tag': Boolean(
							processedData.data.tagId || processedData.data.tagTitle || processedData.data.tagClear
						),
						'journals.update.requested_category': Boolean(
							processedData.data.categoryId ||
								processedData.data.categoryTitle ||
								processedData.data.categoryClear
						),
						'journals.update.requested_bill': Boolean(
							processedData.data.billId || processedData.data.billTitle || processedData.data.billClear
						),
						'journals.update.requested_budget': Boolean(
							processedData.data.budgetId ||
								processedData.data.budgetTitle ||
								processedData.data.budgetClear
						),
						'journals.update.requested_label_titles':
							processedData.data.labelTitles?.length || 0,
						'journals.update.requested_add_label_titles':
							processedData.data.addLabelTitles?.length || 0,
						'journals.update.requested_remove_labels':
							processedData.data.removeLabels?.length || 0
					});

					await runInTransactionWithLogging('Update Journals', async () => {
						const db = getContextDB();
						const beforeSnapshots = await buildTransactionSnapshots({
							db,
							transactionIds: allTransactionIds
						});
						const tagId = handleLinkedItem({
							db,
							id: processedData.data.tagId,
							title: processedData.data.tagTitle,
							clear: processedData.data.tagClear,
							requireActive: true,
							createOrGetItem: tagActions.createOrGet
						});
						const categoryId = handleLinkedItem({
							db,
							id: processedData.data.categoryId,
							title: processedData.data.categoryTitle,
							clear: processedData.data.categoryClear,
							requireActive: true,
							createOrGetItem: categoryActions.createOrGet
						});
						const billId = handleLinkedItem({
							db,
							id: processedData.data.billId,
							title: processedData.data.billTitle,
							clear: processedData.data.billClear,
							requireActive: true,
							createOrGetItem: billActions.createOrGet
						});
						const budgetId = handleLinkedItem({
							db,
							id: processedData.data.budgetId,
							title: processedData.data.budgetTitle,
							clear: processedData.data.budgetClear,
							requireActive: true,
							createOrGetItem: budgetActions.createOrGet
						});

						const accountId = (
							await accountActions.createOrGet({
								title: processedData.data.accountTitle || undefined,
								id: processedData.data.accountId || undefined,
								requireActive: true
							})
						)?.id;

						const otherAccountId = (
							await accountActions.createOrGet({
								title: processedData.data.otherAccountTitle || undefined,
								id: processedData.data.otherAccountId || undefined,
								requireActive: true
							})
						)?.id;

						const targetDate = processedData.data.date
							? expandDate(processedData.data.date)
							: {};

						const complete =
							processedData.data.setComplete === true
								? true
								: processedData.data.clearComplete === true
									? false
									: undefined;
						const reconciled =
							complete === true
								? true
								: processedData.data.setReconciled === true
									? true
									: processedData.data.clearReconciled === true
										? false
										: undefined;
						const dataChecked =
							complete === true
								? true
								: processedData.data.setDataChecked === true
									? true
									: processedData.data.clearDataChecked === true
										? false
										: undefined;
						span.addEvent('journals.update.resolved-flags', {
							'journals.update.complete_resolved':
								complete === undefined ? 'unchanged' : complete ? 'true' : 'false',
							'journals.update.reconciled_resolved':
								reconciled === undefined ? 'unchanged' : reconciled ? 'true' : 'false',
							'journals.update.data_checked_resolved':
								dataChecked === undefined ? 'unchanged' : dataChecked ? 'true' : 'false'
						});

						if (linkedJournals.length > 0) {
							span.addEvent('journals.update.phase.linked', {
								'journals.update.linked_transaction_count': linkedTransactionIds.length
							});
							await dbExecuteLogger(
								db
									.update(journalEntry)
									.set({
										tagId: await tagId,
										categoryId: await categoryId,
										billId: await billId,
										budgetId: await budgetId,
										complete,
										dataChecked,
										reconciled,
										description: processedData.data.description,
										...targetDate,
										...updatedTime()
									})
									.where(inArrayWrapped(journalEntry.transactionId, linkedTransactionIds)),
								'Transaction Journals - Update Journals - Update Linked Journals'
							);
						}

						if (unlinkedJournals.length > 0) {
							const journalIds = unlinkedJournals.map((journal) => journal.id);
							span.addEvent('journals.update.phase.unlinked', {
								'journals.update.unlinked_journal_count': journalIds.length
							});
							await dbExecuteLogger(
								db
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
									.where(inArrayWrapped(journalEntry.id, journalIds)),
								'Transaction Journals - Update Journals - Update Unlinked Journals'
							);
						}
						if (accountId) {
							const journalIds = journals.data.map((journal) => journal.id);
							span.addEvent('journals.update.phase.account', {
								'journals.update.account_journal_count': journalIds.length
							});

							await dbExecuteLogger(
								db
									.update(journalEntry)
									.set({ accountId })
									.where(inArrayWrapped(journalEntry.id, journalIds)),
								'Transaction Journals - Update Journals - Update Account Id'
							);
						}
						if (otherAccountId) {
							const numberWithMoreThan1 = journals.data.reduce(
								(prev, current) => (current.otherJournals.length > 1 ? prev + 1 : prev),
								0
							);
							if (numberWithMoreThan1 > 0) {
								throw new Error(
									'Cannot update other account if there is a transaction with more than 2 journals'
								);
							}

							const updatingJournalIds = journals.data.reduce((prev, current) => {
								return [...prev, ...current.otherJournals.map((item) => item.id)];
							}, [] as string[]);
							span.addEvent('journals.update.phase.other-account', {
								'journals.update.other_account_journal_count': updatingJournalIds.length
							});

							await dbExecuteLogger(
								db
									.update(journalEntry)
									.set({ accountId: otherAccountId })
									.where(inArrayWrapped(journalEntry.id, updatingJournalIds)),
								'Transaction Journals - Update Journals - Update Other Account Id'
							);
						}

						if (processedData.data.amount !== undefined && processedData.data.amount !== null) {
							const journalIds = journals.data.map((journal) => journal.id);
							span.addEvent('journals.update.phase.amount', {
								'journals.update.amount_journal_count': journalIds.length,
								'journals.update.amount_value': processedData.data.amount
							});

							await dbExecuteLogger(
								db
									.update(journalEntry)
									.set({ amount: processedData.data.amount, ...updatedTime() })
									.where(
										and(
											inArrayWrapped(journalEntry.id, journalIds),
											not(eq(journalEntry.amount, processedData.data.amount))
										)
									),
								'Transaction Journals - Update Journals - Update Amount'
							);

							const transactionIds = filterNullUndefinedAndDuplicates(
								journals.data.map((journal) => journal.transactionId)
							);

							const transactionJournals = await dbExecuteLogger(
								db.query.transaction.findMany({
									where: inArrayWrapped(transaction.id, transactionIds),
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
								}),
								'Transaction Journals - Update Journals - Select Transactions'
							);

							await Promise.all(
								transactionJournals.map(async (transaction) => {
									const total = transaction.journals.reduce(
										(prev, current) => prev + current.amount,
										0
									);

									if (total !== 0) {
										const journalToUpdate = transaction.journals.sort((a, b) =>
											new Date(a.updatedAt)
												.toISOString()
												.localeCompare(new Date(b.updatedAt).toISOString())
										)[0];
										await dbExecuteLogger(
											db
												.update(journalEntry)
												.set({
													amount: journalToUpdate.amount - total,
													...updatedTime()
												})
												.where(eq(journalEntry.id, journalToUpdate.id)),
											'Transaction Journals - Update Journals - Update Transaction Amount'
										);
									}
								})
							);
						}

						const labelSetting: { id?: string; title?: string }[] = [
							...(processedData.data.labels
								? processedData.data.labels.map((id) => ({ id }))
								: []),
							...(processedData.data.labelTitles
								? processedData.data.labelTitles.map((title) => ({ title }))
								: [])
						];

						const labelAddition: { id?: string; title?: string }[] = [
							...(processedData.data.addLabels
								? processedData.data.addLabels.map((id) => ({ id }))
								: []),
							...(processedData.data.addLabelTitles
								? processedData.data.addLabelTitles.map((title) => ({ title }))
								: [])
						];

						const labelSettingIds = await Promise.all(
							labelSetting.map(async (currentAdd) => {
								return labelActions.createOrGet({
									...currentAdd,
									requireActive: true
								});
							})
						);

						const labelAdditionIds = await Promise.all(
							labelAddition.map(async (currentAdd) => {
								return labelActions.createOrGet({
									...currentAdd,
									requireActive: true
								});
							})
						);

						const combinedLabels = [...labelSettingIds, ...labelAdditionIds];
						span.addEvent('journals.update.phase.labels', {
							'journals.update.label_setting_count': labelSettingIds.length,
							'journals.update.label_addition_count': labelAdditionIds.length,
							'journals.update.target_journal_count': targetJournals.length
						});
						span.setAttribute('journals.update.label_replace_mode', labelSettingIds.length > 0);
						span.setAttribute('journals.update.label_remove_count', processedData.data.removeLabels?.length || 0);
						span.addEvent('journals.update.label-resolution', {
							'journals.update.label_setting_ids': labelSettingIds
								.map((item) => item?.id)
								.filter(Boolean)
								.slice(0, 10)
								.join(','),
							'journals.update.label_addition_ids': labelAdditionIds
								.map((item) => item?.id)
								.filter(Boolean)
								.slice(0, 10)
								.join(','),
							'journals.update.target_sample_ids': targetJournals.slice(0, 10).join(',')
						});

						if (combinedLabels.length > 0) {
							const itemsToCreate = targetJournals.reduce(
								(prev, currentJournalId) => {
									return [
										...prev,
										...combinedLabels
											.filter((currentLabel) => currentLabel)
											.map((currentLabelId) => {
												return {
													id: nanoid(),
													labelId: currentLabelId?.id || 'unknown',
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

							await dbExecuteLogger(
								db
									.insert(labelsToJournals)
									.values(itemsToCreate)
									.onConflictDoNothing({
										target: [labelsToJournals.journalId, labelsToJournals.labelId]
									}),
								'Transaction Journals - Update Journals - Insert Labels'
							);
						}

						if (processedData.data.removeLabels && processedData.data.removeLabels.length > 0) {
							span.addEvent('journals.update.phase.remove-explicit-labels', {
								'journals.update.explicit_remove_label_count':
									processedData.data.removeLabels.length,
								'journals.update.target_journal_count': targetJournals.length
							});
							await dbExecuteLogger(
								db
									.delete(labelsToJournals)
									.where(
										and(
											inArrayWrapped(labelsToJournals.labelId, processedData.data.removeLabels),
											inArrayWrapped(labelsToJournals.journalId, targetJournals)
										)
									),
								'Transaction Journals - Update Journals - Remove Labels'
							);
						}

						if (labelSettingIds.length > 0) {
							const labelIdArray = labelSettingIds.map((item) => item?.id || 'unknown');
							span.addEvent('journals.update.phase.replace-labels', {
								'journals.update.replace_label_count': labelIdArray.length,
								'journals.update.target_journal_count': targetJournals.length,
								'journals.update.replace_label_ids': labelIdArray.slice(0, 10).join(',')
							});
							await dbExecuteLogger(
								db
									.delete(labelsToJournals)
									.where(
										and(
											inArrayWrapped(labelsToJournals.journalId, targetJournals),
											not(inArrayWrapped(labelsToJournals.labelId, labelIdArray))
										)
									),
								'Transaction Journals - Update Journals - Remove Labels'
							);
						}

						await updateManyTransferInfo({ db, transactionIds: allTransactionIds });
						const afterSnapshots = await buildTransactionSnapshots({
							db,
							transactionIds: allTransactionIds
						});
						await transactionChangeActions.recordChanges({
							db,
							transactionIds: allTransactionIds,
							changeType: 'update',
							beforeSnapshots,
							afterSnapshots,
							source: auditSource
						});
						span.addEvent('journals.update.transfer-refresh', {
							'journals.update.transaction_count': allTransactionIds.length
						});
					});

					await materializedViewActions.setRefreshRequired();
					span.setStatus({ code: SpanStatusCode.OK });
					return targetJournals;
				} catch (error) {
					span.recordException(error as Error);
					span.setStatus({
						code: SpanStatusCode.ERROR,
						message: error instanceof Error ? error.message : 'Unknown error'
					});
					throw error;
				} finally {
					span.end();
				}
			}
		);
	},
	/**
	 * Clones the journals matched by the supplied filter into new transactions and
	 * journals, optionally applying a clone-update payload.
	 */
	cloneJournals: async ({
		filter,
		journalData
	}: {
		filter: JournalFilterSchemaInputType;
		journalData: CloneJournalUpdateSchemaType;
	}): Promise<undefined | string[]> => {
		const db = getContextDB();
		const processedData = cloneJournalUpdateSchema.safeParse(journalData);

		if (!processedData.success) {
			getLogger('journals').error({
				code: 'JOURNAL_005',
				title: 'Invalid Journal Update Data',
				error: processedData.error
			});
			throw new Error('Inavalid Journal Update Data');
		}

		const processedFilter = journalFilterSchema.parse(filter);
		const journals = await journalMaterialisedList({
			filter: processedFilter,
			db
		});

		if (journals.data.length === 0) return;

		const originalTransactionIds = filterNullUndefinedAndDuplicates(
			journals.data.map((journal) => journal.transactionId)
		);

		const transactions = await dbExecuteLogger(
			db.query.transaction.findMany({
				where: inArrayWrapped(transaction.id, originalTransactionIds),
				with: {
					journals: { with: { labels: true } }
				}
			}),
			'Transaction Journals - Clone Journals - Select Transactions'
		);

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
				labels: journal.labels.map((label) => label.labelId),
				importId: undefined,
				importDetailId: undefined,
				tagTitle: undefined,
				billTitle: undefined,
				budgetTitle: undefined,
				categoryTitle: undefined,
				accountTitle: undefined
			}));

			return journals;
		});

		let transactionIds: string[] = [];

		await runInTransactionWithLogging('Clone Journals', async () => {
			transactionIds = await journalActions.createManyTransactionJournals({
				journalEntries: transactionsForCreation,
				isImport: false // Cloned journals are considered manual creation
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
	},
	getTextRecommendationsFromAccountId: async ({ payeeId }: { payeeId: string }) => {
		const account = await accountGetById(payeeId);
		if (!account || account.isCatchall) {
			return [];
		}

		const db = getContextDB();

		const innerSelect = db
			.select({ description: journalEntry.description })
			.from(journalEntry)
			.where(and(eq(journalEntry.accountId, payeeId)))
			.limit(100)
			.as('inner_table');
		const recommendations = await dbExecuteLogger(
			db
				.select({ description: innerSelect.description, count: count() })
				.from(innerSelect)
				.groupBy(innerSelect.description)
				.orderBy((self) => desc(self.count))
				.limit(4),
			'Journals - List Description Recommendations From Payee'
		);
		const filteredRecommendation = recommendations;
		const sortedRecommendations = filteredRecommendation.sort((a, b) => b.count - a.count);
		const totalFound = sortedRecommendations.reduce((acc, item) => acc + item.count, 0);

		return sortedRecommendations.map((item) => {
			return {
				id: item.description,
				title: item.description,
				fraction: totalFound > 0 ? item.count / totalFound : 0,
				count: item.count
			};
		});
	}
};
