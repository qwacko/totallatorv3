import type { DBType } from '@totallator/database';
import { importItemDetail, transaction } from '@totallator/database';
import { updatedTime } from '../misc/updatedTime';
import { eq } from 'drizzle-orm';
import { createCombinedTransactionSchema, createSimpleTransactionSchema } from '@totallator/shared';
import { simpleSchemaToCombinedSchema } from '../journal/simpleSchemaToCombinedSchema';
import { getLogger } from '@/logger';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { journalActions } from '@/actions/journalActions';

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
				getLogger('import', 'Other').debug({ code: 'IMP_TRANS_001', title: 'Starting import process' });
				const importedData = await journalActions.createManyTransactionJournals({
					journalEntries: [processedCombinedTransaction.data],
					isImport: true // This is from an import process
				});

				getLogger('import', 'Other').debug({ code: 'IMP_TRANS_002', title: 'Import Process Complete', importedData });

				getLogger('import', 'Other').info({ code: 'IMP_TRANS_003', title: 'Backlinking Import Data To Journals' });

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
				// Enhanced error logging to capture more details
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
						errorInfo: { errors: processedCombinedTransaction.error.flatten().formErrors },
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
