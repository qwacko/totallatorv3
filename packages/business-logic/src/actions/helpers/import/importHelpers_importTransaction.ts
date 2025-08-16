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

		let currentJournal: any;
		if (processedCombinedTransaction.success) {
			try {
				const importedData = await journalActions.createManyTransactionJournals({
					journalEntries: [processedCombinedTransaction.data],
					isImport: true // This is from an import process
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
							currentJournal = journalData;
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

				getLogger('import').pino.error({ error: e, currentJournal }, 'Import Transaction Error');

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
