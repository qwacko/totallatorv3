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

import { journalActions } from '@totallator/business-logic/actions/journalActions';
import { getLogger } from '@totallator/business-logic/logger';
import { dbExecuteLogger } from '@totallator/business-logic/server/db/dbLogger';

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
					isImport: true // This is from an import process
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
						where: (journalEntry, { eq }) => eq(journalEntry.id, processedItem.data.id)
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

				const updatedJournalIds = await journalActions.updateJournals({
					filter: { idArray: [processedItem.data.id] },
					journalData: processedItem.data
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
							relationId: null,
							relation2Id: null,
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
