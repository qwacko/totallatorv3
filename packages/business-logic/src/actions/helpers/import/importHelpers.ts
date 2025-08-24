import { eq } from 'drizzle-orm';

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

import { accountActions } from '@/actions/accountActions';
import { billActions } from '@/actions/billActions';
import { budgetActions } from '@/actions/budgetActions';
import { categoryActions } from '@/actions/categoryActions';
import { labelActions } from '@/actions/labelActions';
import { tagActions } from '@/actions/tagActions';
import { dbExecuteLogger } from '@/server/db/dbLogger';

import { importItem } from './importItem';

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
	importItem<typeof createLabelSchema, typeof label.$inferSelect>({
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
