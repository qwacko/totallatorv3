import { eq } from 'drizzle-orm';
import { z } from 'zod';

import type { DBType } from '@totallator/database';
import {
	account,
	bill,
	budget,
	category,
	importItemDetail,
	label,
	tag
} from '@totallator/database';
import { createAccountSchema } from '@totallator/shared';
import { createBillSchema } from '@totallator/shared';
import { createBudgetSchema } from '@totallator/shared';
import { createCategorySchema } from '@totallator/shared';
import { createTagSchema } from '@totallator/shared';
import { createLabelSchema } from '@totallator/shared';

import { accountActions } from '@totallator/business-logic/actions/accountActions';
import { billActions } from '@totallator/business-logic/actions/billActions';
import { budgetActions } from '@totallator/business-logic/actions/budgetActions';
import { categoryActions } from '@totallator/business-logic/actions/categoryActions';
import { labelActions } from '@totallator/business-logic/actions/labelActions';
import { tagActions } from '@totallator/business-logic/actions/tagActions';
import { dbExecuteLogger } from '@totallator/business-logic/server/db/dbLogger';

import { importItem } from './importItem';

const createAccountImportSchema = createAccountSchema.extend({ id: z.string().optional() });
const createCategoryImportSchema = createCategorySchema.extend({ id: z.string().optional() });
const createTagImportSchema = createTagSchema.extend({ id: z.string().optional() });
const createLabelImportSchema = createLabelSchema.extend({ id: z.string().optional() });

const withoutId = <T extends { id?: string }>(data: T): Omit<T, 'id'> => {
	const { id: _id, ...rest } = data;
	return rest;
};

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
		schema: createAccountImportSchema,
		createItem: async (data) => {
			if (data.item.id) {
				await accountActions.update({
					id: data.item.id,
					data: {
						...data.item
					}
				});

				const updatedItem = await dbExecuteLogger(
					trx.query.account.findFirst({
						where: eq(account.id, data.item.id)
					}),
					'importAccount - Find Updated Account'
				);

				if (updatedItem) {
					return updatedItem;
				}
			}

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
		schema: createCategoryImportSchema,
		createItem: async (data) => {
				if (data.item.id) {
					await categoryActions.update({
						id: data.item.id,
						data: {
							id: data.item.id,
							...withoutId(data.item)
						}
					});

				const updatedItem = await dbExecuteLogger(
					trx.query.category.findFirst({
						where: eq(category.id, data.item.id)
					}),
					'importCategory - Find Updated Category'
				);

				if (updatedItem) {
					return updatedItem;
				}
			}

			const importedData = await categoryActions.create({
				...withoutId(data.item),
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
		schema: createTagImportSchema,
		createItem: async (data) => {
				if (data.item.id) {
					await tagActions.update({
						id: data.item.id,
						data: {
							id: data.item.id,
							...withoutId(data.item)
						}
					});

				const updatedItem = await dbExecuteLogger(
					trx.query.tag.findFirst({
						where: eq(tag.id, data.item.id)
					}),
					'importTag - Find Updated Tag'
				);

				if (updatedItem) {
					return updatedItem;
				}
			}

			const importedData = await tagActions.create({
				...withoutId(data.item),
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
	importItem<typeof createLabelImportSchema, typeof label.$inferSelect>({
		db: trx,
		item,
		schema: createLabelImportSchema,
		createItem: async (data) => {
				if (data.item.id) {
					await labelActions.update({
						id: data.item.id,
						data: {
							id: data.item.id,
							...withoutId(data.item)
						}
					});

				const updatedItem = await dbExecuteLogger(
					trx.query.label.findFirst({
						where: eq(label.id, data.item.id)
					}),
					'importLabel - Find Updated Label'
				);

				if (updatedItem) {
					return updatedItem;
				}
			}

			const importedData = await labelActions.create({
				...withoutId(data.item),
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
