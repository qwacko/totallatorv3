import type { DBType } from '@totallator/database';
import {
	account,
	bill,
	budget,
	category,
	importItemDetail,
	label,
	tag,
	transaction
} from '@totallator/database';
import { updatedTime } from '../misc/updatedTime';
import { eq } from 'drizzle-orm';
import { createCombinedTransactionSchema, createSimpleTransactionSchema } from '@totallator/shared';
import { createAccountSchema } from '@totallator/shared';
import type { ZodType } from 'zod';
import { createBillSchema } from '@totallator/shared';
import { createBudgetSchema } from '@totallator/shared';
import { createCategorySchema } from '@totallator/shared';
import { createTagSchema } from '@totallator/shared';
import { createLabelSchema } from '@totallator/shared';
import { simpleSchemaToCombinedSchema } from '../journal/simpleSchemaToCombinedSchema';
import { getLogger } from '@/logger';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { journalActions } from '@/actions/journalActions';
import { accountActions } from '@/actions/accountActions';
import { categoryActions } from '@/actions/categoryActions';
import { tagActions } from '@/actions/tagActions';
import { budgetActions } from '@/actions/budgetActions';
import { billActions } from '@/actions/billActions';
import { labelActions } from '@/actions/labelActions';

const importItem = async <T extends Record<string, unknown>, DBT extends { id: string }>({
	db,
	item,
	schema,
	createItem
}: {
	db: DBType;
	item: typeof importItemDetail.$inferSelect;
	schema: ZodType<T>;
	createItem: (data: { item: T; db: DBType }) => Promise<DBT | undefined>;
}) => {
	const processedItem = schema.safeParse(item.processedInfo?.dataToUse);
	if (processedItem.success) {
		try {
			const createdItem = await createItem({ item: processedItem.data, db });

			if (createdItem) {
				await dbExecuteLogger(
					db
						.update(importItemDetail)
						.set({
							status: 'imported',
							importInfo: createdItem,
							relationId: createdItem.id,
							...updatedTime()
						})
						.where(eq(importItemDetail.id, item.id)),
					'importItem - Mark Imported'
				);
			} else {
				await dbExecuteLogger(
					db
						.update(importItemDetail)
						.set({
							status: 'importError',
							errorInfo: { errors: ['Account Not Found'] },
							...updatedTime()
						})
						.where(eq(importItemDetail.id, item.id)),
					'importItem - Mark Error 1'
				);
			}
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

			getLogger().error('Import Item Error', errorDetails);

			await dbExecuteLogger(
				db
					.update(importItemDetail)
					.set({
						status: 'importError',
						errorInfo: {
							error: errorDetails
						},
						...updatedTime()
					})
					.where(eq(importItemDetail.id, item.id)),
				'importItem - Mark Error 2'
			);
		}
	} else {
		await dbExecuteLogger(
			db
				.update(importItemDetail)
				.set({
					status: 'importError',
					errorInfo: { errors: processedItem.error.flatten().formErrors },
					...updatedTime()
				})
				.where(eq(importItemDetail.id, item.id)),
			'importItem - Mark Error 3'
		);
	}
};
export async function importTransaction({
	item,
	trx
}: {
	item: typeof importItemDetail.$inferSelect;
	trx: DBType;
}) {
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

				getLogger().error('Import Transaction Error', errorDetails);

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
export const importAccount = async ({
	item,
	trx
}: {
	item: typeof importItemDetail.$inferSelect;
	trx: DBType;
}) =>
	importItem({
		db: trx,
		item,
		schema: createAccountSchema,
		createItem: async (data) => {
			const importedData = await accountActions.create({
				...data.item,
				type: data.item.type || 'expense',
				status: data.item.status || 'active',
				importId: item.importId,
				importDetailId: item.id
			});

			const createdItem = await dbExecuteLogger(
				trx.query.account.findFirst({
					where: eq(account.id, importedData)
				}),
				'importAccount - Find Account'
			);

			return createdItem;
		}
	});
export const importBill = async ({
	item,
	trx
}: {
	item: typeof importItemDetail.$inferSelect;
	trx: DBType;
}) =>
	importItem({
		db: trx,
		item,
		schema: createBillSchema,
		createItem: async (data) => {
			const importedData = await billActions.create({
				...data.item,
				status: data.item.status || 'active',
				importId: item.importId,
				importDetailId: item.id
			});

			const createdItem = await dbExecuteLogger(
				trx.query.bill.findFirst({
					where: eq(bill.id, importedData)
				}),
				'importBill - Find Bill'
			);

			return createdItem;
		}
	});
export const importBudget = async ({
	item,
	trx
}: {
	item: typeof importItemDetail.$inferSelect;
	trx: DBType;
}) =>
	importItem({
		db: trx,
		item,
		schema: createBudgetSchema,
		createItem: async (data) => {
			const importedData = await budgetActions.create({
				...data.item,
				status: data.item.status || 'active',
				importId: item.importId,
				importDetailId: item.id
			});

			const createdItem = await dbExecuteLogger(
				trx.query.budget.findFirst({
					where: eq(budget.id, importedData)
				}),
				'importBudget - Find Budget'
			);

			return createdItem;
		}
	});
export const importCategory = async ({
	item,
	trx
}: {
	item: typeof importItemDetail.$inferSelect;
	trx: DBType;
}) =>
	importItem({
		db: trx,
		item,
		schema: createCategorySchema,
		createItem: async (data) => {
			const importedData = await categoryActions.create({
				...data.item,
				status: data.item.status || 'active',
				importId: item.importId,
				importDetailId: item.id
			});

			const createdItem = await dbExecuteLogger(
				trx.query.category.findFirst({
					where: eq(category.id, importedData)
				}),
				'importCategory - Find Category'
			);

			return createdItem;
		}
	});
export const importTag = async ({
	item,
	trx
}: {
	item: typeof importItemDetail.$inferSelect;
	trx: DBType;
}) =>
	importItem({
		db: trx,
		item,
		schema: createTagSchema,
		createItem: async (data) => {
			const importedData = await tagActions.create({
				...data.item,
				status: data.item.status || 'active',
				importId: item.importId,
				importDetailId: item.id
			});

			const createdItem = await dbExecuteLogger(
				trx.query.tag.findFirst({
					where: eq(tag.id, importedData)
				}),
				'importTag - Find Tag'
			);

			return createdItem;
		}
	});
export const importLabel = async ({
	item,
	trx
}: {
	item: typeof importItemDetail.$inferSelect;
	trx: DBType;
}) =>
	importItem({
		db: trx,
		item,
		schema: createLabelSchema,
		createItem: async (data) => {
			const importedData = await labelActions.create({
				...data.item,
				status: data.item.status || 'active',
				importId: item.importId,
				importDetailId: item.id
			});

			const createdItem = await dbExecuteLogger(
				trx.query.label.findFirst({
					where: eq(label.id, importedData)
				}),
				'importLabel - Find Label'
			);

			return createdItem;
		}
	});
