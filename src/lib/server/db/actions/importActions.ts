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
	importMapping,
	importTable,
	journalEntry,
	label,
	tag
} from '../schema';
import { updatedTime } from './helpers/updatedTime';
import { eq, and, getTableColumns, desc, sql, inArray } from 'drizzle-orm';
import Papa from 'papaparse';
import {
	createSimpleTransactionSchema,
	type CreateSimpleTransactionType
} from '$lib/schema/journalSchema';
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
import { processObjectReturnTransaction } from '$lib/helpers/importTransformation';

export const importActions = {
	list: async ({ db }: { db: DBType }) => {
		const imports = await db
			.select({
				...getTableColumns(importTable),
				importMappingId: importMapping.id,
				importMappingTitle: importMapping.title,
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
			.leftJoin(importMapping, eq(importMapping.id, importTable.importMappingId))
			.groupBy(importTable.id)
			.orderBy(desc(importTable.createdAt))
			.execute();

		return imports;
	},
	storeCSV: async ({
		newFile,
		db,
		type,
		importMapping
	}: {
		db: DBType;
		newFile: File;
		type: importTypeType;
		importMapping: string | undefined;
	}) => {
		if (newFile.type !== 'text/csv') {
			throw new Error('Incorrect FileType');
		}
		if (type === 'mappedImport' && !importMapping) {
			throw new Error('No Mapping Selected');
		}
		if (importMapping) {
			const result = await tActions.importMapping.getById({ db, id: importMapping });
			if (!result) {
				throw new Error(`Mapping ${importMapping} Not Found`);
			}
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
				importMappingId: importMapping,
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
		schema,
		importDataToSchema = (data) => ({ data: data as S }),
		getUniqueIdentifier,
		checkUniqueIdentifiers
	}: {
		db: DBType;
		id: string;
		data: Papa.ParseResult<unknown>;
		schema: ZodSchema<S>;
		importDataToSchema?: (data: unknown) => { data: S } | { errors: string[] };
		getUniqueIdentifier?: ((data: S) => string | null | undefined) | undefined;
		checkUniqueIdentifiers?: (data: string[]) => Promise<string[]>;
	}) => {
		await Promise.all(
			data.data.map(async (currentRow) => {
				const row = currentRow as Record<string, unknown>;
				const importDetailId = nanoid();
				const preprocessedData = importDataToSchema(row);
				if ('errors' in preprocessedData) {
					await db
						.insert(importItemDetail)
						.values({
							id: importDetailId,
							...updatedTime(),
							status: 'error',
							processedInfo: { source: row },
							errorInfo: { errors: preprocessedData.errors },
							importId: id
						})
						.execute();
					return;
				}
				const validatedData = schema.safeParse(preprocessedData.data);
				if (validatedData.success) {
					const unqiueIdentifiers = getUniqueIdentifier
						? getUniqueIdentifier(validatedData.data)
						: undefined;
					const foundUniqueIdentifiers =
						checkUniqueIdentifiers && unqiueIdentifiers
							? await checkUniqueIdentifiers([unqiueIdentifiers])
							: undefined;

					if (foundUniqueIdentifiers && foundUniqueIdentifiers.length > 0) {
						await db
							.insert(importItemDetail)
							.values({
								id: importDetailId,
								...updatedTime(),
								status: 'duplicate',
								processedInfo: {
									dataToUse: validatedData.data,
									source: row,
									processed: preprocessedData
								},
								importId: id
							})
							.execute();
					} else {
						await db
							.insert(importItemDetail)
							.values({
								id: importDetailId,
								...updatedTime(),
								status: 'processed',
								processedInfo: {
									dataToUse: validatedData.data,
									source: row,
									processed: preprocessedData
								},
								importId: id
							})
							.execute();
					}
				} else {
					await db
						.insert(importItemDetail)
						.values({
							id: importDetailId,
							...updatedTime(),
							status: 'error',
							processedInfo: { source: row, processed: preprocessedData },
							errorInfo: { error: validatedData.error },
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
						await importActions.processItems({
							db,
							id,
							data: processedData,
							schema: createSimpleTransactionSchema
						});
					} else if (importData.type === 'account') {
						await importActions.processItems({
							db,
							id,
							data: processedData,
							schema: createAccountSchema,
							getUniqueIdentifier: (data) =>
								`${data.accountGroupCombined ? data.accountGroupCombined + ':' : ''}:${data.title}`,
							checkUniqueIdentifiers: async (data) => {
								const existingAccounts = await db
									.select()
									.from(account)
									.where(inArray(account.accountTitleCombined, data))
									.execute();
								return existingAccounts.map((item) => item.accountTitleCombined);
							}
						});
					} else if (importData.type === 'bill') {
						await importActions.processItems({
							db,
							id,
							data: processedData,
							schema: createBillSchema,
							getUniqueIdentifier: (data) => data.title,
							checkUniqueIdentifiers: async (data) => {
								const existingBills = await db
									.select()
									.from(bill)
									.where(inArray(bill.title, data))
									.execute();
								return existingBills.map((item) => item.title);
							}
						});
					} else if (importData.type === 'budget') {
						await importActions.processItems({
							db,
							id,
							data: processedData,
							schema: createBudgetSchema,
							getUniqueIdentifier: (data) => data.title,
							checkUniqueIdentifiers: async (data) => {
								const existingBudgets = await db
									.select()
									.from(budget)
									.where(inArray(budget.title, data))
									.execute();
								return existingBudgets.map((item) => item.title);
							}
						});
					} else if (importData.type === 'category') {
						await importActions.processItems({
							db,
							id,
							data: processedData,
							schema: createCategorySchema,
							getUniqueIdentifier: (data) => data.title,
							checkUniqueIdentifiers: async (data) => {
								const existingCategories = await db
									.select()
									.from(category)
									.where(inArray(category.title, data))
									.execute();
								return existingCategories.map((item) => item.title);
							}
						});
					} else if (importData.type === 'tag') {
						await importActions.processItems({
							db,
							id,
							data: processedData,
							schema: createTagSchema,
							getUniqueIdentifier: (data) => data.title,
							checkUniqueIdentifiers: async (data) => {
								const existingTags = await db
									.select()
									.from(tag)
									.where(inArray(tag.title, data))
									.execute();
								return existingTags.map((item) => item.title);
							}
						});
					} else if (importData.type === 'label') {
						await importActions.processItems({
							db,
							id,
							data: processedData,
							schema: createLabelSchema,
							getUniqueIdentifier: (data) => data.title,
							checkUniqueIdentifiers: async (data) => {
								const existingLabels = await db
									.select()
									.from(label)
									.where(inArray(label.title, data))
									.execute();
								return existingLabels.map((item) => item.title);
							}
						});
					} else if (importData.type === 'mappedImport') {
						if (importData.importMappingId) {
							const importMappingDetail = await tActions.importMapping.getById({
								db,
								id: importData.importMappingId
							});

							if (importMappingDetail) {
								if (importMappingDetail.configuration) {
									const config = importMappingDetail.configuration;

									await importActions.processItems<CreateSimpleTransactionType>({
										db,
										id,
										data: processedData,
										schema: createSimpleTransactionSchema as ZodSchema<CreateSimpleTransactionType>,
										importDataToSchema: (data) => {
											const currentRow = data as Record<string, unknown>;
											const currentProcessedRow = processObjectReturnTransaction(
												currentRow,
												config
											);
											if (currentProcessedRow.errors) {
												return { errors: currentProcessedRow.errors.map((item) => item.error) };
											} else {
												const validatedData = createSimpleTransactionSchema.safeParse(
													currentProcessedRow.transaction
												);
												if (!validatedData.success) {
													return { errors: [validatedData.error.message] };
												} else {
													return { data: validatedData.data };
												}
											}
										},
										getUniqueIdentifier: (data) => data.uniqueId,
										checkUniqueIdentifiers: async (data) => {
											const existingTransactions = await db
												.select()
												.from(journalEntry)
												.where(inArray(journalEntry.uniqueId, data))
												.execute();
											return filterNullUndefinedAndDuplicates(
												existingTransactions.map((item) => item.uniqueId)
											);
										}
									});
								}
							}
						}
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
