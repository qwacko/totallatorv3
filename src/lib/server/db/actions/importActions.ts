import { logging } from '$lib/server/logging';
import { serverEnv } from '$lib/server/serverEnv';
import { nanoid } from 'nanoid';
import { writeFileSync, readFileSync } from 'fs';
import type { DBType } from '../db';
import {
	account,
	bill,
	budget,
	category,
	importItemDetail,
	importTable,
	journalEntry,
	label,
	tag
} from '../schema';
import { updatedTime } from './helpers/updatedTime';
import { eq, and, getTableColumns, desc, sql } from 'drizzle-orm';
import Papa from 'papaparse';
import { createSimpleTransactionSchema } from '$lib/schema/journalSchema';
import { tActions } from './tActions';
import { filterNullUndefinedAndDuplicates } from '../../../../routes/(loggedIn)/journals/filterNullUndefinedAndDuplicates';
import { createAccountSchema } from '$lib/schema/accountSchema';
import type { ZodSchema } from 'zod';
import { createBillSchema } from '$lib/schema/billSchema';
import { createBudgetSchema } from '$lib/schema/budgetSchema';
import { createCategorySchema } from '$lib/schema/categorySchema';
import { createTagSchema } from '$lib/schema/tagSchema';
import { createLabelSchema } from '$lib/schema/labelSchema';
import { importTypeEnum, type importTypeType } from '$lib/schema/importSchema';
import {
	importTransaction,
	importAccount,
	importBill,
	importBudget,
	importCategory,
	importTag,
	importLabel
} from './helpers/importHelpers';

export const importActions = {
	list: async ({ db }: { db: DBType }) => {
		const imports = await db
			.select({
				...getTableColumns(importTable),
				numErrors:
					sql`count(CASE WHEN ${importItemDetail.status} = 'error' THEN 1 ELSE NULL END)`.mapWith(
						Number
					),
				numImportErrors:
					sql`count(CASE WHEN ${importItemDetail.status} = 'importError' THEN 1 ELSE NULL END)`.mapWith(
						Number
					),
				numProcessed:
					sql`count(CASE WHEN ${importItemDetail.status} = 'processed' THEN 1 ELSE NULL END)`.mapWith(
						Number
					),
				numDuplicate:
					sql`count(CASE WHEN ${importItemDetail.status} = 'duplicate' THEN 1 ELSE NULL END)`.mapWith(
						Number
					),
				numImport:
					sql`count(CASE WHEN ${importItemDetail.status} = 'imported' THEN 1 ELSE NULL END)`.mapWith(
						Number
					),
				numImportError:
					sql`count(CASE WHEN ${importItemDetail.status} = 'importError' THEN 1 ELSE NULL END)`.mapWith(
						Number
					)
			})
			.from(importTable)
			.leftJoin(importItemDetail, eq(importItemDetail.importId, importTable.id))
			.groupBy(importTable.id)
			.orderBy(desc(importTable.createdAt))
			.execute();

		return imports;
	},
	storeCSV: async ({ newFile, db, type }: { db: DBType; newFile: File; type: importTypeType }) => {
		if (newFile.type !== 'text/csv') {
			throw new Error('Incorrect FileType');
		}
		logging.info('New Filename', newFile.name);

		const originalFilename = newFile.name;
		const id = nanoid();
		const dateTime = new Date().toISOString().slice(0, 10);

		const saveFilename = `${dateTime}_${id}_${originalFilename}`;
		const combinedFilename = `${serverEnv.IMPORT_DIR}${saveFilename}`;

		writeFileSync(combinedFilename, Buffer.from(await newFile.arrayBuffer()));

		await db
			.insert(importTable)
			.values({
				id,
				filename: combinedFilename,
				title: originalFilename,
				...updatedTime(),
				status: 'created',
				source: 'csv',
				type
			})
			.execute();

		return id;
	},
	processItems: async <S extends Record<string, unknown>>({
		db,
		id,
		data,
		schema
	}: {
		db: DBType;
		id: string;
		data: Papa.ParseResult<unknown>;
		schema: ZodSchema<S>;
	}) => {
		await Promise.all(
			data.data.map(async (row) => {
				const validatedData = schema.safeParse(row);
				const importDetailId = nanoid();
				if (validatedData.success) {
					await db
						.insert(importItemDetail)
						.values({
							id: importDetailId,
							...updatedTime(),
							status: 'processed',
							processedInfo: validatedData.data,
							importId: id
						})
						.execute();
				} else {
					await db
						.insert(importItemDetail)
						.values({
							id: importDetailId,
							...updatedTime(),
							status: 'error',
							processedInfo: row,
							errorInfo: validatedData.error,
							importId: id
						})
						.execute();
				}
			})
		);
	},
	get: async ({ id, db }: { db: DBType; id: string }) => {
		const data = await db.select().from(importTable).where(eq(importTable.id, id));

		return { importInfo: data[0] };
	},
	getDetail: async ({ db, id }: { db: DBType; id: string }) => {
		const data = await db.select().from(importTable).where(eq(importTable.id, id));

		if (!data.length) {
			throw new Error('Import Not Found');
		}

		const importData = data[0];

		if (importData.status === 'created') {
			if (importData.source === 'csv') {
				if (!importData.filename) {
					throw new Error('Import File Not Found');
				}
				const file = readFileSync(importData.filename);
				const processedData = Papa.parse(file.toString(), { header: true, skipEmptyLines: true });

				if (processedData.errors && processedData.errors.length > 0) {
					await db
						.update(importTable)
						.set({
							status: 'error',
							errorInfo: processedData.errors,
							...updatedTime()
						})
						.where(eq(importTable.id, id))
						.execute();
				} else {
					if (importData.type === 'transaction') {
						importActions.processItems({
							db,
							id,
							data: processedData,
							schema: createSimpleTransactionSchema
						});
					} else if (importData.type === 'account') {
						importActions.processItems({
							db,
							id,
							data: processedData,
							schema: createAccountSchema
						});
					} else if (importData.type === 'bill') {
						importActions.processItems({
							db,
							id,
							data: processedData,
							schema: createBillSchema
						});
					} else if (importData.type === 'budget') {
						importActions.processItems({
							db,
							id,
							data: processedData,
							schema: createBudgetSchema
						});
					} else if (importData.type === 'category') {
						importActions.processItems({
							db,
							id,
							data: processedData,
							schema: createCategorySchema
						});
					} else if (importData.type === 'tag') {
						importActions.processItems({
							db,
							id,
							data: processedData,
							schema: createTagSchema
						});
					} else if (importData.type === 'label') {
						importActions.processItems({
							db,
							id,
							data: processedData,
							schema: createLabelSchema
						});
					}
				}
			}

			await db
				.update(importTable)
				.set({ status: 'processed', ...updatedTime() })
				.where(eq(importTable.id, id))
				.execute();
		}

		const returnData = await db.query.importTable
			.findFirst({
				where: eq(importTable.id, id),
				with: {
					importDetails: {
						with: {
							journal: true,
							journal2: true,
							bill: true,
							budget: true,
							category: true,
							tag: true,
							label: true,
							account: true
						}
					}
				}
			})
			.execute();

		if (!returnData) {
			throw new Error('Error Retrieving Import Details');
		}
		const linkedItemCount = returnData.importDetails.reduce(
			(prev, current) =>
				prev +
				Number(current.journal) +
				Number(current.journal2) +
				Number(current.bill) +
				Number(current.budget) +
				Number(current.category) +
				Number(current.tag) +
				Number(current.label) +
				Number(current.account),
			0
		);

		return {
			type: returnData.type,
			detail: returnData,
			linkedItemCount
		};
	},
	changeType: async ({ db, id, newType }: { db: DBType; id: string; newType: importTypeType }) => {
		const targetItems = await db.select().from(importTable).where(eq(importTable.id, id)).execute();

		if (!targetItems || targetItems.length === 0) {
			throw new Error('Import Not Found');
		}
		if (!importTypeEnum.includes(newType)) {
			throw new Error('Target Import Type Incorrect');
		}
		if (targetItems[0].status !== 'processed' && targetItems[0].status !== 'created') {
			throw new Error('Target Import Must Be Processed or Created only to change type');
		}

		await db.transaction(async (db) => {
			await db
				.update(importTable)
				.set({ type: newType, ...updatedTime() })
				.where(eq(importTable.id, id))
				.execute();
			await importActions.reprocess({ db, id });
		});
	},
	reprocess: async ({ db, id }: { db: DBType; id: string }) => {
		const item = await db.select().from(importTable).where(eq(importTable.id, id));

		if (!item.length) {
			throw new Error('Import Not Found');
		}

		const itemDetails = await db
			.select()
			.from(importItemDetail)
			.where(eq(importItemDetail.importId, id))
			.execute();

		const importData = item[0];

		if (importData.status === 'complete') {
			throw new Error('Import Complete. Cannot Reprocess');
		}

		const numImported = itemDetails.filter((item) => item.status === 'imported').length;

		if (numImported > 0) {
			throw new Error(
				'Items From This Import Already Imported, Cannot re-process without deleting.'
			);
		}

		await db.transaction(async (trx) => {
			await trx
				.update(importTable)
				.set({ status: 'created', errorInfo: null, ...updatedTime() })
				.where(eq(importTable.id, id))
				.execute();

			await trx.delete(importItemDetail).where(eq(importItemDetail.importId, id)).execute();
		});
	},
	doImport: async ({ db, id }: { db: DBType; id: string }) => {
		const importInfoList = await db
			.select()
			.from(importTable)
			.where(eq(importTable.id, id))
			.execute();

		const importInfo = importInfoList[0];
		if (!importInfo) {
			throw new Error('Import Not Found');
		}
		if (importInfo.status !== 'processed') {
			throw new Error('Import is not in state Processed. Cannot import.');
		}

		const importDetails = await db
			.select()
			.from(importItemDetail)
			.where(and(eq(importItemDetail.importId, id), eq(importItemDetail.status, 'processed')));

		await db.transaction(async (trx) => {
			await Promise.all(
				importDetails.map(async (item) => {
					if (importInfo.type === 'transaction') {
						await importTransaction({ item, trx });
					} else if (importInfo.type === 'account') {
						await importAccount({ item, trx });
					} else if (importInfo.type === 'bill') {
						await importBill({ item, trx });
					} else if (importInfo.type === 'budget') {
						await importBudget({ item, trx });
					} else if (importInfo.type === 'category') {
						await importCategory({ item, trx });
					} else if (importInfo.type === 'tag') {
						await importTag({ item, trx });
					} else if (importInfo.type === 'label') {
						await importLabel({ item, trx });
					}
				})
			);

			await db
				.update(importTable)
				.set({ status: 'complete', ...updatedTime() })
				.where(eq(importTable.id, id))
				.execute();

			await tActions.reusableFitler.applyFollowingImport({ db: trx, importId: id });
		});
	},
	forgetImport: async ({ db, id }: { db: DBType; id: string }) => {
		await db.transaction(async (db) => {
			await db.delete(importTable).where(eq(importTable.id, id)).execute();
			await db.delete(importItemDetail).where(eq(importItemDetail.importId, id)).execute();
			await db
				.update(journalEntry)
				.set({ importId: null })
				.where(eq(journalEntry.importId, id))
				.execute();

			await db
				.update(bill)
				.set({ importId: null, importDetailId: null })
				.where(eq(bill.importId, id))
				.execute();
			await db
				.update(budget)
				.set({ importId: null, importDetailId: null })
				.where(eq(budget.importId, id))
				.execute();
			await db
				.update(category)
				.set({ importId: null, importDetailId: null })
				.where(eq(category.importId, id))
				.execute();
			await db
				.update(tag)
				.set({ importId: null, importDetailId: null })
				.where(eq(tag.importId, id))
				.execute();
			await db
				.update(account)
				.set({ importId: null, importDetailId: null })
				.where(eq(account.importId, id))
				.execute();
			await db
				.update(account)
				.set({ importId: null, importDetailId: null })
				.where(eq(account.importId, id))
				.execute();
			await db
				.update(label)
				.set({ importId: null, importDetailId: null })
				.where(eq(label.importId, id))
				.execute();
		});
	},
	canDelete: async ({ db, id }: { db: DBType; id: string }) => {
		const importDetails = await db
			.select()
			.from(importTable)
			.where(eq(importTable.id, id))
			.execute();

		if (!importDetails || importDetails.length === 0) {
			return false;
		}

		const importInfo = importDetails[0];

		if (importInfo.status !== 'complete' && importInfo.status !== 'imported') {
			return true;
		}

		if (importInfo.type === 'transaction') {
			return true;
		}
		if (importInfo.type === 'account') {
			const accounts = await db.select().from(account).where(eq(account.importId, id));
			return tActions.account.canDeleteMany(
				db,
				accounts.map((item) => item.id)
			);
		}
		if (importInfo.type === 'bill') {
			const bills = await db.select().from(bill).where(eq(bill.importId, id));
			return tActions.bill.canDeleteMany(
				db,
				bills.map((item) => item.id)
			);
		}
		if (importInfo.type === 'budget') {
			const budgets = await db.select().from(budget).where(eq(budget.importId, id));
			return tActions.budget.canDeleteMany(
				db,
				budgets.map((item) => item.id)
			);
		}
		if (importInfo.type === 'category') {
			const categories = await db.select().from(category).where(eq(category.importId, id));
			return tActions.category.canDeleteMany(
				db,
				categories.map((item) => item.id)
			);
		}
		if (importInfo.type === 'label') {
			const labels = await db.select().from(label).where(eq(label.importId, id));
			return tActions.label.canDeleteMany(
				db,
				labels.map((item) => item.id)
			);
		}
		if (importInfo.type === 'tag') {
			const tags = await db.select().from(tag).where(eq(tag.importId, id));
			return tActions.tag.canDeleteMany(
				db,
				tags.map((item) => item.id)
			);
		}
	},
	deleteLinked: async ({ db, id }: { db: DBType; id: string }) => {
		const canDelete = await importActions.canDelete({ db, id });

		if (canDelete) {
			const importDetails = await db.query.importTable.findFirst({
				where: eq(importTable.id, id),
				with: {
					bills: true,
					budgets: true,
					categories: true,
					tags: true,
					labels: true,
					journals: true
				}
			});
			await db.transaction(async (db) => {
				if (importDetails) {
					const transactionIds = filterNullUndefinedAndDuplicates(
						importDetails.journals.map((item) => item.transactionId)
					);
					await tActions.journal.hardDeleteTransactions({ db, transactionIds });

					await tActions.bill.deleteMany(
						db,
						importDetails.bills.map((item) => ({ id: item.id }))
					);
					await tActions.budget.deleteMany(
						db,
						importDetails.budgets.map((item) => ({ id: item.id }))
					);
					await tActions.category.deleteMany(
						db,
						importDetails.categories.map((item) => ({ id: item.id }))
					);
					await tActions.tag.deleteMany(
						db,
						importDetails.tags.map((item) => ({ id: item.id }))
					);
					await tActions.label.hardDeleteMany(
						db,
						importDetails.labels.map((item) => ({ id: item.id }))
					);
					await db.delete(importItemDetail).where(eq(importItemDetail.importId, id)).execute();
					await db
						.update(importTable)
						.set({ status: 'created' })
						.where(eq(importTable.id, id))
						.execute();
				}
			});
		}
	},
	delete: async ({ db, id }: { db: DBType; id: string }) => {
		const canDelete = await importActions.canDelete({ db, id });

		if (canDelete) {
			await db.transaction(async (db) => {
				await importActions.deleteLinked({ db, id });
				await db.delete(importTable).where(eq(importTable.id, id)).execute();
			});
		}
	}
};
