import type { DBType } from '../../../db';
import {
	account,
	bill,
	budget,
	category,
	importItemDetail,
	label,
	tag,
	transaction
} from '../../../postgres/schema';
import { updatedTime } from '../misc/updatedTime';
import { eq } from 'drizzle-orm';
import {
	createCombinedTransactionSchema,
	createSimpleTransactionSchema
} from '$lib/schema/journalSchema';
import { tActions } from '../../tActions';
import { createAccountSchema } from '$lib/schema/accountSchema';
import type { ZodType } from 'zod';
import { createBillSchema } from '$lib/schema/billSchema';
import { createBudgetSchema } from '$lib/schema/budgetSchema';
import { createCategorySchema } from '$lib/schema/categorySchema';
import { createTagSchema } from '$lib/schema/tagSchema';
import { createLabelSchema } from '$lib/schema/labelSchema';
import { simpleSchemaToCombinedSchema } from '../journal/simpleSchemaToCombinedSchema';
import { logging } from '$lib/server/logging';
import { dbExecuteLogger } from '$lib/server/db/dbLogger';

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
			logging.error('Import Item Error', JSON.stringify(e, null, 2));

			await dbExecuteLogger(
				db
					.update(importItemDetail)
					.set({
						status: 'importError',
						errorInfo: { error: e as Record<string, unknown> },
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
					errorInfo: { errors: processedItem.error.errors.map((e) => e.message) },
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
				const importedData = await tActions.journal.createManyTransactionJournals({
					db: trx,
					journalEntries: [processedCombinedTransaction.data]
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
				logging.error('Import Transaction Error', JSON.stringify(e, null, 2));

				await dbExecuteLogger(
					trx
						.update(importItemDetail)
						.set({
							status: 'importError',
							errorInfo: { error: e as Record<string, unknown> },
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
						errorInfo: { errors: processedCombinedTransaction.error.errors.map((e) => e.message) },
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
					errorInfo: { errors: processedItem.error.errors.map((e) => e.message) },
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
			const importedData = await tActions.account.create(data.db, {
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
			const importedData = await tActions.bill.create(data.db, {
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
			const importedData = await tActions.budget.create(data.db, {
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
			const importedData = await tActions.category.create(data.db, {
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
			const importedData = await tActions.tag.create(data.db, {
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
			const importedData = await tActions.label.create(data.db, {
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
