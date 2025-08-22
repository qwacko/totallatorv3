import { eq } from 'drizzle-orm';
import type { z } from 'zod';

import type { DBType } from '@totallator/database';
import { importItemDetail } from '@totallator/database';
import {
	createAccountSchema,
	createBillSchema,
	createBudgetSchema,
	createCategorySchema,
	createLabelSchema,
	createTagSchema
} from '@totallator/shared';

import { getLogger } from '@/logger';
import { dbExecuteLogger } from '@/server/db/dbLogger';

import { updatedTime } from '../misc/updatedTime';

export const importItem = async <
	T extends
		| typeof createAccountSchema
		| typeof createBillSchema
		| typeof createBudgetSchema
		| typeof createCategorySchema
		| typeof createTagSchema
		| typeof createLabelSchema,
	DBT extends { id: string }
>({
	db,
	item,
	schema,
	createItem
}: {
	db: DBType;
	item: typeof importItemDetail.$inferSelect;
	schema: T;
	createItem: (data: { item: z.infer<T>; db: DBType }) => Promise<DBT | undefined>;
}) => {
	const processedItem = schema.safeParse(item.processedInfo?.dataToUse);
	if (processedItem.success) {
		try {
			const createdItem = await createItem({
				item: processedItem.data as z.infer<T>,
				db
			});

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

			getLogger('import').error({
				code: 'IMP_ITEM_001',
				title: 'Import Item Error',
				errorDetails
			});

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
