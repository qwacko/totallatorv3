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
} from '../../../schema';
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
				await db
					.update(importItemDetail)
					.set({
						status: 'imported',
						importInfo: createdItem,
						relationId: createdItem.id,
						...updatedTime()
					})
					.where(eq(importItemDetail.id, item.id))
					.execute();
			} else {
				await db
					.update(importItemDetail)
					.set({
						status: 'importError',
						errorInfo: { errors: ['Account Not Found'] },
						...updatedTime()
					})
					.where(eq(importItemDetail.id, item.id))
					.execute();
			}
		} catch (e) {
			logging.error('Import Item Error', JSON.stringify(e, null, 2));

			await db
				.update(importItemDetail)
				.set({
					status: 'importError',
					errorInfo: { error: e as Record<string, unknown> },
					...updatedTime()
				})
				.where(eq(importItemDetail.id, item.id))
				.execute();
		}
	} else {
		await db
			.update(importItemDetail)
			.set({
				status: 'importError',
				errorInfo: { errors: processedItem.error.errors.map((e) => e.message) },
				...updatedTime()
			})
			.where(eq(importItemDetail.id, item.id))
			.execute();
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
						const journalData = await trx.query.transaction.findFirst({
							where: eq(transaction.id, transactionId),
							with: { journals: true }
						});

						if (journalData) {
							await trx
								.update(importItemDetail)
								.set({
									status: 'imported',
									importInfo: journalData,
									relationId: journalData.journals[0].id,
									relation2Id: journalData.journals[1].id,
									...updatedTime()
								})
								.where(eq(importItemDetail.id, item.id))
								.execute();
						} else {
							await trx
								.update(importItemDetail)
								.set({
									status: 'importError',
									errorInfo: { errors: ['Journal Not Found'] },
									...updatedTime()
								})
								.where(eq(importItemDetail.id, item.id))
								.execute();
						}
					})
				);
			} catch (e) {
				logging.error('Import Transaction Error', JSON.stringify(e, null, 2));

				await trx
					.update(importItemDetail)
					.set({
						status: 'importError',
						errorInfo: { error: e as Record<string, unknown> },
						...updatedTime()
					})
					.where(eq(importItemDetail.id, item.id))
					.execute();
			}
		} else {
			await trx
				.update(importItemDetail)
				.set({
					status: 'importError',
					errorInfo: { errors: processedCombinedTransaction.error.errors.map((e) => e.message) },
					...updatedTime()
				})
				.where(eq(importItemDetail.id, item.id))
				.execute();
		}
	} else {
		await trx
			.update(importItemDetail)
			.set({
				status: 'importError',
				errorInfo: { errors: processedItem.error.errors.map((e) => e.message) },
				...updatedTime()
			})
			.where(eq(importItemDetail.id, item.id))
			.execute();
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

			const createdItem = await trx.query.account.findFirst({
				where: eq(account.id, importedData)
			});

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

			const createdItem = await trx.query.bill.findFirst({
				where: eq(bill.id, importedData)
			});

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

			const createdItem = await trx.query.budget.findFirst({
				where: eq(budget.id, importedData)
			});

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

			const createdItem = await trx.query.category.findFirst({
				where: eq(category.id, importedData)
			});

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

			const createdItem = await trx.query.tag.findFirst({
				where: eq(tag.id, importedData)
			});

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

			const createdItem = await trx.query.label.findFirst({
				where: eq(label.id, importedData)
			});

			return createdItem;
		}
	});
