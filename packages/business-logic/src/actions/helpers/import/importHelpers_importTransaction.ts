import { eq } from 'drizzle-orm';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { z } from 'zod';

import type { DBType } from '@totallator/database';
import { importItemDetail, transaction } from '@totallator/database';
import {
	createCombinedTransactionSchema,
	createSimpleTransactionSchema,
	updateJournalSchema
} from '@totallator/shared';

import { journalActions } from '../../journalActions';
import { getLogger } from '../../../logger';
import { dbExecuteLogger } from '../../../server/db/dbLogger';

import { simpleSchemaToCombinedSchema } from '../journal/simpleSchemaToCombinedSchema';
import { updatedTime } from '../misc/updatedTime';

const updateJournalImportSchema = updateJournalSchema.extend({
	id: z.string()
});
const importTracer = trace.getTracer('@totallator/business-logic/imports');

const serializeError = (error: unknown): Record<string, unknown> => {
	if (error instanceof Error) {
		return {
			message: error.message,
			name: error.name,
			stack: error.stack
		};
	}

	if (error && typeof error === 'object' && !Array.isArray(error)) {
		return error as Record<string, unknown>;
	}

	return { value: error };
};

const areStringSetsEqual = (left: (string | undefined | null)[], right: (string | undefined | null)[]) => {
	const normalize = (values: (string | undefined | null)[]) =>
		values
			.filter((value): value is string => Boolean(value))
			.map((value) => value.trim())
			.sort();

	const normalizedLeft = normalize(left);
	const normalizedRight = normalize(right);

	return (
		normalizedLeft.length === normalizedRight.length &&
		normalizedLeft.every((value, index) => value === normalizedRight[index])
	);
};

const normalizeNoOpJournalUpdate = ({
	journalData,
	existingJournal
}: {
	journalData: z.infer<typeof updateJournalImportSchema>;
	existingJournal: any;
}) => {
	const normalizedData = { ...journalData } as any;

	if (normalizedData.description === existingJournal.description) {
		delete normalizedData.description;
	}
	if (normalizedData.amount === existingJournal.amount) {
		delete normalizedData.amount;
	}
	if (normalizedData.date === existingJournal.dateText) {
		delete normalizedData.date;
	}

	if (normalizedData.accountId === existingJournal.accountId) {
		delete normalizedData.accountId;
	}
	if (normalizedData.accountTitle === existingJournal.account?.accountTitleCombined) {
		delete normalizedData.accountTitle;
	}

	const currentOtherJournal = existingJournal.transaction?.journals?.find(
		(currentJournal: any) => currentJournal.id !== existingJournal.id
	);
	if (normalizedData.otherAccountId === currentOtherJournal?.accountId) {
		delete normalizedData.otherAccountId;
	}
	if (normalizedData.otherAccountTitle === currentOtherJournal?.account?.accountTitleCombined) {
		delete normalizedData.otherAccountTitle;
	}

	if (normalizedData.tagId === existingJournal.tagId) {
		delete normalizedData.tagId;
	}
	if (normalizedData.tagTitle === existingJournal.tag?.title) {
		delete normalizedData.tagTitle;
	}
	if (normalizedData.billId === existingJournal.billId) {
		delete normalizedData.billId;
	}
	if (normalizedData.billTitle === existingJournal.bill?.title) {
		delete normalizedData.billTitle;
	}
	if (normalizedData.budgetId === existingJournal.budgetId) {
		delete normalizedData.budgetId;
	}
	if (normalizedData.budgetTitle === existingJournal.budget?.title) {
		delete normalizedData.budgetTitle;
	}
	if (normalizedData.categoryId === existingJournal.categoryId) {
		delete normalizedData.categoryId;
	}
	if (normalizedData.categoryTitle === existingJournal.category?.title) {
		delete normalizedData.categoryTitle;
	}

	const currentLabelIds = existingJournal.labels?.map((item: any) => item.label?.id) || [];
	const currentLabelTitles = existingJournal.labels?.map((item: any) => item.label?.title) || [];

	if (normalizedData.labels && areStringSetsEqual(normalizedData.labels, currentLabelIds)) {
		delete normalizedData.labels;
	}
	if (
		normalizedData.labelTitles &&
		areStringSetsEqual(normalizedData.labelTitles, currentLabelTitles)
	) {
		delete normalizedData.labelTitles;
	}
	if (normalizedData.addLabels) {
		const filteredAddLabels = normalizedData.addLabels.filter(
			(labelId: string) => !currentLabelIds.includes(labelId)
		);
		if (filteredAddLabels.length > 0) normalizedData.addLabels = filteredAddLabels;
		else delete normalizedData.addLabels;
	}
	if (normalizedData.addLabelTitles) {
		const filteredAddLabelTitles = normalizedData.addLabelTitles.filter(
			(title: string) => !currentLabelTitles.includes(title)
		);
		if (filteredAddLabelTitles.length > 0) normalizedData.addLabelTitles = filteredAddLabelTitles;
		else delete normalizedData.addLabelTitles;
	}
	if (normalizedData.removeLabels) {
		const filteredRemoveLabels = normalizedData.removeLabels.filter((labelId: string) =>
			// Only keep actual removals; no-op removals are stripped.
			currentLabelIds.includes(labelId)
		);
		if (filteredRemoveLabels.length > 0) normalizedData.removeLabels = filteredRemoveLabels;
		else delete normalizedData.removeLabels;
	}

	if (normalizedData.setComplete === true && existingJournal.complete) {
		delete normalizedData.setComplete;
	}
	if (normalizedData.clearComplete === true && !existingJournal.complete) {
		delete normalizedData.clearComplete;
	}
	if (normalizedData.setReconciled === true && existingJournal.reconciled) {
		delete normalizedData.setReconciled;
	}
	if (normalizedData.clearReconciled === true && !existingJournal.reconciled) {
		delete normalizedData.clearReconciled;
	}
	if (normalizedData.setDataChecked === true && existingJournal.dataChecked) {
		delete normalizedData.setDataChecked;
	}
	if (normalizedData.clearDataChecked === true && !existingJournal.dataChecked) {
		delete normalizedData.clearDataChecked;
	}
	if (normalizedData.setLinked === true && existingJournal.linked) {
		delete normalizedData.setLinked;
	}
	if (normalizedData.clearLinked === true && !existingJournal.linked) {
		delete normalizedData.clearLinked;
	}

	if (normalizedData.tagClear === true && !existingJournal.tagId) {
		delete normalizedData.tagClear;
	}
	if (normalizedData.billClear === true && !existingJournal.billId) {
		delete normalizedData.billClear;
	}
	if (normalizedData.budgetClear === true && !existingJournal.budgetId) {
		delete normalizedData.budgetClear;
	}
	if (normalizedData.categoryClear === true && !existingJournal.categoryId) {
		delete normalizedData.categoryClear;
	}

	return normalizedData as z.input<typeof updateJournalImportSchema>;
};

export async function importTransaction({
	item,
	trx
}: {
	item: typeof importItemDetail.$inferSelect;
	trx: DBType;
}): Promise<void> {
	const processedInfo = item.processedInfo;
	const processedItem = createSimpleTransactionSchema.safeParse(
		processedInfo ? processedInfo.dataToUse : undefined
	);
	if (processedItem.success) {
		const combinedTransaction = simpleSchemaToCombinedSchema({
			...processedItem.data,
			importId: item.importId,
			importDetailId: item.id
		});
		const processedCombinedTransaction =
			createCombinedTransactionSchema.safeParse(combinedTransaction);

		if (processedCombinedTransaction.success) {
			try {
				getLogger('import', 'Other').debug({
					code: 'IMP_TRANS_001',
					title: 'Starting import process'
				});
				const importedData = await journalActions.createManyTransactionJournals({
					journalEntries: [processedCombinedTransaction.data],
					isImport: true, // This is from an import process
					auditSource: {
						sourceType: 'import',
						importId: item.importId,
						importDetailId: item.id,
						summary: 'Created from import'
					}
				});

				getLogger('import', 'Other').debug({
					code: 'IMP_TRANS_002',
					title: 'Import Process Complete',
					importedData
				});

				getLogger('import', 'Other').info({
					code: 'IMP_TRANS_003',
					title: 'Backlinking Import Data To Journals'
				});

				await Promise.all(
					importedData.map(async (transactionId) => {
						const journalData = await dbExecuteLogger(
							trx.query.transaction.findFirst({
								where: eq(transaction.id, transactionId),
								with: { journals: true }
							}),
							'importTransaction - Find Transaction'
						);

						if (journalData) {
							await dbExecuteLogger(
								trx
									.update(importItemDetail)
									.set({
										status: 'imported',
										importInfo: journalData,
										relationId: journalData.journals[0].id,
										relation2Id: journalData.journals[1].id,
										...updatedTime()
									})
									.where(eq(importItemDetail.id, item.id)),
								'importTransaction - Mark Imported'
							);
						} else {
							await dbExecuteLogger(
								trx
									.update(importItemDetail)
									.set({
										status: 'importError',
										errorInfo: { errors: ['Journal Not Found'] },
										...updatedTime()
									})
									.where(eq(importItemDetail.id, item.id)),
								'importTransaction - Mark Error 1'
							);
						}
					})
				);
			} catch (e) {
				const errorDetails = {
					message: e instanceof Error ? e.message : 'Unknown error',
					stack: e instanceof Error ? e.stack : undefined,
					name: e instanceof Error ? e.name : undefined,
					code: (e as any)?.code,
					severity: (e as any)?.severity,
					query: (e as any)?.query,
					parameters: (e as any)?.parameters,
					errorObject: e
				};

				getLogger('import').error({
					code: 'IMP_TRANS_001',
					title: 'Import Transaction Error',
					error: e,
					currentJournal: processedCombinedTransaction.data
				});

				await dbExecuteLogger(
					trx
						.update(importItemDetail)
						.set({
							status: 'importError',
							errorInfo: {
								error: errorDetails
							},
							...updatedTime()
						})
						.where(eq(importItemDetail.id, item.id)),
					'importTransaction - Mark Error 2'
				);
			}
		} else {
			getLogger('import').error({
				code: 'IMP_TRANS_002',
				title: 'Import Item Error (createCombinedTransaction Schema)',
				errors: processedCombinedTransaction.error,
				processedInfo,
				id: item.id
			});
			await dbExecuteLogger(
				trx
					.update(importItemDetail)
					.set({
						status: 'importError',
						errorInfo: {
							errors: processedCombinedTransaction.error.flatten().formErrors
						},
						...updatedTime()
					})
					.where(eq(importItemDetail.id, item.id)),
				'importTransaction - Mark Error 3'
			);
		}
	} else {
		getLogger('import').error({
			code: 'IMP_TRANS_003',
			title: 'Import Item Error (createSimpleTransaction Schema)',
			errors: processedItem.error,
			processedInfo,
			id: item.id
		});
		await dbExecuteLogger(
			trx
				.update(importItemDetail)
				.set({
					status: 'importError',
					errorInfo: { errors: processedItem.error.flatten().formErrors },
					...updatedTime()
				})
				.where(eq(importItemDetail.id, item.id)),
			'importTransaction - Mark Error 4'
		);
	}
}

export async function importJournalUpdate({
	item,
	trx
}: {
	item: typeof importItemDetail.$inferSelect;
	trx: DBType;
}): Promise<void> {
	await importTracer.startActiveSpan(
		'import.journal-update.row',
		{
			attributes: {
				'import.detail.id': item.id,
				'import.row.has_processed_info': item.processedInfo ? true : false
			}
		},
		async (span) => {
			const processedInfo = item.processedInfo;
			const processedItem = updateJournalImportSchema.safeParse(
				processedInfo ? processedInfo.dataToUse : undefined
			);

			if (!processedItem.success) {
				span.addEvent('import.journal-update.invalid-schema', {
					'import.detail.id': item.id
				});
				await dbExecuteLogger(
					trx
						.update(importItemDetail)
						.set({
							status: 'importError',
							errorInfo: { errors: processedItem.error.flatten().formErrors },
							...updatedTime()
						})
						.where(eq(importItemDetail.id, item.id)),
					'importJournalUpdate - Mark Error Invalid Schema'
				);
				span.setStatus({ code: SpanStatusCode.ERROR, message: 'Invalid schema' });
				span.end();
				return;
			}

			span.setAttribute('journal.target.id', processedItem.data.id);
			span.setAttribute('journal.update.has_date', processedItem.data.date ? true : false);
			span.setAttribute(
				'journal.update.label_title_count',
				processedItem.data.labelTitles?.length || 0
			);
			span.setAttribute(
				'journal.update.add_label_title_count',
				processedItem.data.addLabelTitles?.length || 0
			);
			span.setAttribute(
				'journal.update.remove_label_count',
				processedItem.data.removeLabels?.length || 0
			);
			span.addEvent('import.journal-update.parsed', {
				'journal.target.id': processedItem.data.id,
				'journal.update.description_set': processedItem.data.description ? true : false,
				'journal.update.account_title_set': processedItem.data.accountTitle ? true : false,
				'journal.update.other_account_title_set': processedItem.data.otherAccountTitle ? true : false,
				'journal.update.amount_set':
					processedItem.data.amount !== undefined && processedItem.data.amount !== null,
				'journal.update.clear_complete': processedItem.data.clearComplete === true,
				'journal.update.set_complete': processedItem.data.setComplete === true,
				'journal.update.clear_reconciled': processedItem.data.clearReconciled === true,
				'journal.update.set_reconciled': processedItem.data.setReconciled === true,
				'journal.update.clear_data_checked': processedItem.data.clearDataChecked === true,
				'journal.update.set_data_checked': processedItem.data.setDataChecked === true
			});

			try {
				const existingJournal = await dbExecuteLogger(
					trx.query.journalEntry.findFirst({
						where: (journalEntry, { eq }) => eq(journalEntry.id, processedItem.data.id),
						with: {
							account: {
								columns: {
									id: true,
									accountTitleCombined: true
								}
							},
							tag: { columns: { id: true, title: true } },
							bill: { columns: { id: true, title: true } },
							budget: { columns: { id: true, title: true } },
							category: { columns: { id: true, title: true } },
							labels: {
								with: {
									label: {
										columns: {
											id: true,
											title: true
										}
									}
								}
							},
							transaction: {
								columns: {
									id: true
								},
								with: {
									journals: {
										columns: {
											id: true,
											accountId: true
										},
										with: {
											account: {
												columns: {
													id: true,
													accountTitleCombined: true
												}
											}
										}
									}
								}
							}
						}
					}),
					'importJournalUpdate - Find Existing Journal'
				);

				if (existingJournal) {
					span.addEvent('import.journal-update.before-state', {
						'journal.before.id': existingJournal.id,
						'journal.before.transaction_id': existingJournal.transactionId,
						'journal.before.account_id': existingJournal.accountId,
						'journal.before.amount': existingJournal.amount,
						'journal.before.date': existingJournal.date.toISOString(),
						'journal.before.complete': existingJournal.complete,
						'journal.before.reconciled': existingJournal.reconciled,
						'journal.before.data_checked': existingJournal.dataChecked,
						'journal.before.transfer': existingJournal.transfer
					});
				} else {
					span.addEvent('import.journal-update.before-state.missing', {
						'journal.target.id': processedItem.data.id
					});
				}

				const normalizedJournalData = existingJournal
					? normalizeNoOpJournalUpdate({
							journalData: processedItem.data,
							existingJournal
						})
					: processedItem.data;

				const updatedJournalIds = await journalActions.updateJournals({
					filter: {
						idArray: [processedItem.data.id],
						account: { type: ['asset', 'liability', 'expense', 'income'] }
					},
					journalData: normalizedJournalData,
					auditSource: {
						sourceType: 'import',
						importId: item.importId,
						importDetailId: item.id,
						summary: 'Updated from import'
					}
				});
				span.addEvent('import.journal-update.update-journals-result', {
					'journal.update.updated_id_count': updatedJournalIds?.length || 0
				});

				if (!updatedJournalIds || updatedJournalIds.length === 0) {
					await dbExecuteLogger(
						trx
							.update(importItemDetail)
							.set({
								status: 'importError',
								errorInfo: {
									errors: [
										'Journal update could not be applied (journal not found or disallowed update)'
									]
								},
								...updatedTime()
							})
							.where(eq(importItemDetail.id, item.id)),
						'importJournalUpdate - Mark Error Update Not Applied'
					);
					span.setStatus({
						code: SpanStatusCode.ERROR,
						message: 'Journal update could not be applied'
					});
					span.end();
					return;
				}

				const updatedJournal = await dbExecuteLogger(
					trx.query.journalEntry.findFirst({
						where: (journalEntry, { eq }) => eq(journalEntry.id, processedItem.data.id)
					}),
					'importJournalUpdate - Find Updated Journal'
				);

				if (!updatedJournal) {
					await dbExecuteLogger(
						trx
							.update(importItemDetail)
							.set({
								status: 'importError',
								errorInfo: { errors: ['Journal Not Found'] },
								...updatedTime()
							})
							.where(eq(importItemDetail.id, item.id)),
						'importJournalUpdate - Mark Error Not Found'
					);
					span.setStatus({ code: SpanStatusCode.ERROR, message: 'Updated journal not found' });
					span.end();
					return;
				}

				span.addEvent('import.journal-update.updated-journal-loaded', {
					'journal.target.id': updatedJournal.id,
					'journal.updated.transaction_id': updatedJournal.transactionId
				});
				span.addEvent('import.journal-update.after-state', {
					'journal.after.id': updatedJournal.id,
					'journal.after.transaction_id': updatedJournal.transactionId,
					'journal.after.account_id': updatedJournal.accountId,
					'journal.after.amount': updatedJournal.amount,
					'journal.after.date': updatedJournal.date.toISOString(),
					'journal.after.complete': updatedJournal.complete,
					'journal.after.reconciled': updatedJournal.reconciled,
					'journal.after.data_checked': updatedJournal.dataChecked,
					'journal.after.transfer': updatedJournal.transfer
				});

					await dbExecuteLogger(
						trx
							.update(importItemDetail)
							.set({
								status: 'imported',
								importInfo: updatedJournal,
								relationId: processedItem.data.id,
								relation2Id:
									updatedJournalIds.find((journalId) => journalId !== processedItem.data.id) || null,
								...updatedTime()
							})
						.where(eq(importItemDetail.id, item.id)),
					'importJournalUpdate - Mark Imported'
				);
				span.setStatus({ code: SpanStatusCode.OK });
			} catch (e) {
				span.recordException(e as Error);
				await dbExecuteLogger(
						trx
							.update(importItemDetail)
							.set({
								status: 'importError',
								errorInfo: { error: serializeError(e) },
								...updatedTime()
							})
							.where(eq(importItemDetail.id, item.id)),
					'importJournalUpdate - Mark Error'
				);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: e instanceof Error ? e.message : 'Unknown error'
				});
			} finally {
				span.end();
			}
		}
	);
}
