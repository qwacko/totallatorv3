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
	tag,
	transaction
} from '../schema';
import { updatedTime } from './helpers/updatedTime';
import { eq, and, getTableColumns, desc, sql } from 'drizzle-orm';
import Papa from 'papaparse';
import {
	createCombinedTransactionSchema,
	createSimpleTransactionSchema,
	type CreateCombinedTransactionType,
	type CreateSimpleTransactionType
} from '$lib/schema/journalSchema';
import { tActions } from './tActions';
import { filterNullUndefinedAndDuplicates } from '../../../../routes/(loggedIn)/journals/filterNullUndefinedAndDuplicates';
import { createAccountSchema } from '$lib/schema/accountSchema';
import type { ZodSchema, ZodType } from 'zod';
import { createBillSchema } from '$lib/schema/billSchema';
import { createBudgetSchema } from '$lib/schema/budgetSchema';
import { createCategorySchema } from '$lib/schema/categorySchema';
import { createTagSchema } from '$lib/schema/tagSchema';
import { createLabelSchema } from '$lib/schema/labelSchema';

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
	storeCSV: async ({ newFile, db }: { db: DBType; newFile: File }) => {
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
				type: 'transaction'
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
		}

		await db
			.update(importTable)
			.set({ status: 'processed', ...updatedTime() })
			.execute();

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

const simpleSchemaToCombinedSchema = (
	data: CreateSimpleTransactionType
): CreateCombinedTransactionType => {
	const {
		toAccountId,
		toAccountTitle,
		fromAccountId,
		fromAccountTitle,
		amount,
		...sharedProperties
	} = data;

	return [
		{
			...sharedProperties,
			accountId: fromAccountId,
			accountTitle: fromAccountTitle,
			amount: -amount
		},
		{ ...sharedProperties, accountId: toAccountId, accountTitle: toAccountTitle, amount: amount }
	];
};

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
	const processedItem = schema.safeParse(item.processedInfo);
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
						errorInfo: 'Account Not Found',
						...updatedTime()
					})
					.where(eq(importItemDetail.id, item.id))
					.execute();
			}
		} catch (e) {
			console.log(e);

			await db
				.update(importItemDetail)
				.set({ status: 'importError', errorInfo: e, ...updatedTime() })
				.where(eq(importItemDetail.id, item.id))
				.execute();
		}
	} else {
		await db
			.update(importItemDetail)
			.set({ status: 'importError', errorInfo: processedItem.error, ...updatedTime() })
			.where(eq(importItemDetail.id, item.id))
			.execute();
	}
};

async function importTransaction({
	item,
	trx
}: {
	item: typeof importItemDetail.$inferSelect;
	trx: DBType;
}) {
	const processedItem = createSimpleTransactionSchema.safeParse(item.processedInfo);
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
									errorInfo: 'Journal Not Found',
									...updatedTime()
								})
								.where(eq(importItemDetail.id, item.id))
								.execute();
						}
					})
				);
			} catch (e) {
				console.log(e);

				await trx
					.update(importItemDetail)
					.set({ status: 'importError', errorInfo: e, ...updatedTime() })
					.where(eq(importItemDetail.id, item.id))
					.execute();
			}
		} else {
			await trx
				.update(importItemDetail)
				.set({
					status: 'importError',
					errorInfo: processedCombinedTransaction.error,
					...updatedTime()
				})
				.where(eq(importItemDetail.id, item.id))
				.execute();
		}
	} else {
		await trx
			.update(importItemDetail)
			.set({ status: 'importError', errorInfo: processedItem.error, ...updatedTime() })
			.where(eq(importItemDetail.id, item.id))
			.execute();
	}
}

const importAccount = async ({
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

const importBill = async ({
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

const importBudget = async ({
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

const importCategory = async ({
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

const importTag = async ({
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
const importLabel = async ({
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
