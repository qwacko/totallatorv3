import { serverEnv } from '$lib/server/serverEnv';
import { nanoid } from 'nanoid';
import type { DBType } from '../db';
import {
	account,
	autoImportTable,
	bill,
	budget,
	category,
	importItemDetail,
	importMapping,
	importTable,
	journalEntry,
	label,
	tag,
	type AutoImportTableType,
	type ImportMappingTableType,
	type ImportTableType
} from '../postgres/schema';
import { updatedTime } from './helpers/misc/updatedTime';
import { eq, and, not, count as drizzleCount, lt } from 'drizzle-orm';
import { tActions } from './tActions';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
import { z, type ZodSchema } from 'zod';
import {
	type CreateImportSchemaType,
	type ImportFilterSchemaType,
	type UpdateImportSchemaType
} from '$lib/schema/importSchema';
import {
	importTransaction,
	importAccount,
	importBill,
	importBudget,
	importCategory,
	importTag,
	importLabel
} from './helpers/import/importHelpers';

import { getImportDetail, type GetImportDetailReturnType } from './helpers/import/getImportDetail';
import { processCreatedImport } from './helpers/import/processImport';
import { streamingDelay } from '$lib/server/testingDelay';
import {
	importListSubquery,
	type ImportSubqueryReturnData
} from './helpers/import/importListSubquery';
import { importToOrderByToSQL } from './helpers/import/importOrderByToSQL';
import { importFilterToQuery } from './helpers/import/importFilterToQuery';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { importFileHandler } from '$lib/server/files/fileHandler';
import { logging } from '$lib/server/logging';
import { dbExecuteLogger } from '../dbLogger';
import { tLogger } from '../transactionLogger';
import type { PaginatedResults } from './helpers/journal/PaginationType';

export const importActions = {
	numberActive: async (db: DBType): Promise<number> => {
		const result = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(importTable.id) })
				.from(importTable)
				.where(inArrayWrapped(importTable.status, ['importing', 'awaitingImport'])),
			'Import - Number Active'
		);

		return result[0].count;
	},
	list: async ({
		db,
		filter
	}: {
		db: DBType;
		filter: ImportFilterSchemaType;
	}): Promise<PaginatedResults<ImportSubqueryReturnData>> => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const internalQuery = importListSubquery(db);

		const where = importFilterToQuery({ filter: restFilter, query: internalQuery });

		const results = await dbExecuteLogger(
			db
				.select()
				.from(internalQuery)
				.where(and(...where))
				.limit(pageSize)
				.offset(page * pageSize)
				.orderBy(...importToOrderByToSQL({ query: internalQuery, orderBy })),
			'Import - List - Query'
		);

		const resultCount = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(internalQuery.id) })
				.from(internalQuery)
				.where(and(...where)),
			'Import - List - Count'
		);

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	listDetails: async ({
		db,
		filter
	}: {
		db: DBType;
		filter: ImportFilterSchemaType;
	}): Promise<
		PaginatedResults<ImportSubqueryReturnData> & { details: GetImportDetailReturnType[] }
	> => {
		const imports = await importActions.list({ db, filter });

		const importDetails = await Promise.all(
			imports.data.map(async (item) => {
				return getImportDetail({ db, id: item.id });
			})
		);

		return { ...imports, details: importDetails };
	},
	update: async ({ db, data }: { db: DBType; data: UpdateImportSchemaType }): Promise<void> => {
		const { id, ...restData } = data;

		await dbExecuteLogger(
			db.update(importTable).set(restData).where(eq(importTable.id, id)),
			'Import - Update'
		);
	},
	store: async ({
		db,
		data,
		autoImportId
	}: {
		db: DBType;
		data: CreateImportSchemaType;
		autoImportId?: string;
	}): Promise<string> => {
		const { file: newFile, importType: type, ...restData } = data;

		if (newFile.type !== 'text/csv') {
			if (type !== 'mappedImport') {
				throw new Error('Filetype must be CSV except for mapped imports');
			}

			const fileString = await newFile.text();
			const jsonFile = JSON.parse(fileString);
			const schemaValidation = z.array(z.record(z.any()));
			const parsedData = schemaValidation.safeParse(jsonFile);

			if (!parsedData.success) {
				throw new Error('Filetype must be CSV or JSON Array of Objects');
			}
		}

		const fileType = newFile.type === 'text/csv' ? 'csv' : 'json';

		if (type === 'mappedImport' && !importMapping) {
			throw new Error('No Mapping Selected');
		}
		if (restData.importMappingId) {
			const result = await tActions.importMapping.getById({ db, id: restData.importMappingId });
			if (!result) {
				throw new Error(`Mapping ${importMapping} Not Found`);
			}
		}

		const originalFilename = newFile.name;
		const id = nanoid();
		const dateTime = new Date().toISOString().slice(0, 10);

		const saveFilename = `${dateTime}_${id}_${originalFilename}`;

		await importFileHandler.write(
			saveFilename,
			fileType === 'json' ? Buffer.from(await newFile.arrayBuffer()) : await newFile.text()
		);

		await dbExecuteLogger(
			db.insert(importTable).values({
				id,
				filename: saveFilename,
				title: originalFilename,
				...updatedTime(),
				status: 'created',
				source: fileType,
				autoImportId,
				type,
				...restData
			}),
			'Import - Store - Insert'
		);

		try {
			await processCreatedImport({ db, id });
		} catch (e) {
			logging.error('Error Processing Import', e);
			await dbExecuteLogger(
				db
					.update(importTable)
					.set({ status: 'error', errorInfo: e, ...updatedTime() })
					.where(eq(importTable.id, id)),
				'Import - Store - Error'
			);
		}

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
		data: Papa.ParseResult<unknown> | { data: Record<string, any>[] };
		schema: ZodSchema<S>;
		importDataToSchema?: (data: unknown) => { data: S } | { errors: string[] };
		getUniqueIdentifier?: ((data: S) => string | null | undefined) | undefined;
		checkUniqueIdentifiers?: (data: string[]) => Promise<string[]>;
	}): Promise<void> => {
		await Promise.all(
			data.data.map(async (currentRow) => {
				const row = currentRow as Record<string, unknown>;
				const importDetailId = nanoid();
				const preprocessedData = importDataToSchema(row);
				if ('errors' in preprocessedData) {
					await dbExecuteLogger(
						db.insert(importItemDetail).values({
							id: importDetailId,
							...updatedTime(),
							status: 'error',
							processedInfo: { source: row },
							errorInfo: { errors: preprocessedData.errors },
							importId: id
						}),
						'Import - Process Items - Error'
					);
					return;
				}
				const validatedData = schema.safeParse(preprocessedData.data);
				if (validatedData.success) {
					const unqiueIdentifier = getUniqueIdentifier
						? getUniqueIdentifier(validatedData.data)
						: undefined;
					const foundUniqueIdentifiers =
						checkUniqueIdentifiers && unqiueIdentifier
							? await checkUniqueIdentifiers([unqiueIdentifier])
							: undefined;

					if (foundUniqueIdentifiers && foundUniqueIdentifiers.length > 0) {
						await dbExecuteLogger(
							db.insert(importItemDetail).values({
								id: importDetailId,
								...updatedTime(),
								status: 'duplicate',
								processedInfo: {
									dataToUse: validatedData.data,
									source: row,
									processed: preprocessedData
								},
								importId: id,
								uniqueId: unqiueIdentifier
							}),
							'Import - Process Items - Duplicate'
						);
					} else {
						await dbExecuteLogger(
							db.insert(importItemDetail).values({
								id: importDetailId,
								...updatedTime(),
								status: 'processed',
								processedInfo: {
									dataToUse: validatedData.data,
									source: row,
									processed: preprocessedData
								},
								importId: id,
								uniqueId: unqiueIdentifier
							}),
							'Import - Process Items - Processed'
						);
					}
				} else {
					await dbExecuteLogger(
						db.insert(importItemDetail).values({
							id: importDetailId,
							...updatedTime(),
							status: 'error',
							processedInfo: { source: row, processed: preprocessedData },
							errorInfo: { errors: validatedData.error.errors.map((e) => e.message) },
							importId: id
						}),
						'Import - Process Items - Error 2'
					);
				}
			})
		);
	},
	get: async ({
		id,
		db
	}: {
		db: DBType;
		id: string;
	}): Promise<
		| { importInfo: undefined }
		| {
				importInfo: {
					import: ImportTableType;
					auto_import: AutoImportTableType | null;
					import_mapping: ImportMappingTableType | null;
				};
		  }
	> => {
		const data = await dbExecuteLogger(
			db
				.select()
				.from(importTable)
				.leftJoin(importMapping, eq(importMapping.id, importTable.importMappingId))
				.leftJoin(autoImportTable, eq(autoImportTable.id, importTable.autoImportId))
				.where(eq(importTable.id, id)),
			'Import - Get'
		);

		if (data.length === 0) {
			return { importInfo: undefined };
		}

		return { importInfo: data[0] };
	},
	getDetail: async ({ db, id }: { db: DBType; id: string }): Promise<GetImportDetailReturnType> => {
		await streamingDelay();
		const data = await dbExecuteLogger(
			db.select().from(importTable).where(eq(importTable.id, id)),
			'Import - Get'
		);

		if (!data.length) {
			throw new Error('Import Not Found');
		}

		const importData = data[0];

		if (importData.status === 'created') {
			await processCreatedImport({ db, id });
		}

		return getImportDetail({ db, id });
	},
	reprocess: async ({ db, id }: { db: DBType; id: string }): Promise<void> => {
		const item = await dbExecuteLogger(
			db.select().from(importTable).where(eq(importTable.id, id)),
			'Import - Reprocess - Get'
		);

		if (!item.length) {
			throw new Error('Import Not Found');
		}

		const itemDetails = await dbExecuteLogger(
			db.select().from(importItemDetail).where(eq(importItemDetail.importId, id)),
			'Import - Reprocess - Get Details'
		);

		const importData = item[0];

		if (importData.status === 'complete') {
			throw new Error('Import Complete. Cannot Reprocess');
		}

		if (importData.status === 'importing' || importData.status === 'awaitingImport') {
			throw new Error('Import Currently Importing. Cannot Reprocess');
		}

		const numImported = itemDetails.filter((item) => item.status === 'imported').length;

		if (numImported > 0) {
			throw new Error(
				'Items From This Import Already Imported, Cannot re-process without deleting.'
			);
		}

		await tLogger(
			'Reprocess Import',
			db.transaction(async (trx) => {
				await dbExecuteLogger(
					trx
						.update(importTable)
						.set({ status: 'created', errorInfo: null, ...updatedTime() })
						.where(eq(importTable.id, id)),
					'Import - Reprocess - Update Import'
				);

				await dbExecuteLogger(
					trx.delete(importItemDetail).where(eq(importItemDetail.importId, id)),
					'Import - Reprocess - Delete Details'
				);
			})
		);
	},
	triggerImport: async ({ db, id }: { db: DBType; id: string }): Promise<void> => {
		const importInfoList = await dbExecuteLogger(
			db.select().from(importTable).where(eq(importTable.id, id)),
			'Import - Trigger Import - Get'
		);

		const importInfo = importInfoList[0];
		if (!importInfo) {
			throw new Error('Import Not Found');
		}
		if (importInfo.status !== 'processed') {
			throw new Error('Import is not in state Processed. Cannot trigger import.');
		}

		await dbExecuteLogger(
			db
				.update(importTable)
				.set({ status: 'awaitingImport', ...updatedTime() })
				.where(eq(importTable.id, id)),
			'Import - Trigger Import - Update'
		);
	},
	doRequiredImports: async ({ db }: { db: DBType }): Promise<void> => {
		const importTimeoutms = serverEnv.IMPORT_TIMEOUT_MIN * 60 * 1000;
		const earliestUpdatedAt = new Date(Date.now() - importTimeoutms);

		//Upate All Imports That Are Set To Auto Process to Awaiting Import
		await dbExecuteLogger(
			db
				.update(importTable)
				.set({ status: 'awaitingImport', ...updatedTime() })
				.where(and(eq(importTable.status, 'processed'), eq(importTable.autoProcess, true))),
			'Import - Do Required Imports - Update'
		);

		const numberImportingTooLong = await dbExecuteLogger(
			db
				.select()
				.from(importTable)
				.where(
					and(eq(importTable.status, 'importing'), lt(importTable.updatedAt, earliestUpdatedAt))
				),
			'Import - Do Required Imports - Get Importing Too Long'
		);

		await Promise.all(
			numberImportingTooLong.map(async (item) => {
				await dbExecuteLogger(
					db
						.update(importTable)
						.set({ status: 'error', errorInfo: 'Import Timed Out', ...updatedTime() })
						.where(eq(importTable.id, item.id)),
					'Import - Do Required Imports - Update Importing Too Long'
				);
			})
		);

		const numberImporting = await dbExecuteLogger(
			db.select().from(importTable).where(eq(importTable.status, 'importing')),
			'Import - Do Required Imports - Get Importing'
		);

		//Only One Import Should Be Executing At A Time
		if (numberImporting.length > 0) {
			return;
		}

		const importDetails = await dbExecuteLogger(
			db.select().from(importTable).where(eq(importTable.status, 'awaitingImport')).limit(1),
			'Import - Do Required Imports - Get Awaiting Import'
		);

		await Promise.all(
			importDetails.map(async (item) => {
				await importActions.doImport({ db, id: item.id });
			})
		);
	},
	doImport: async ({ db, id }: { db: DBType; id: string }): Promise<void> => {
		const importInfoList = await dbExecuteLogger(
			db.select().from(importTable).where(eq(importTable.id, id)),
			'Import - Do Import - Get'
		);

		const importInfo = importInfoList[0];
		if (!importInfo) {
			throw new Error('Import Not Found');
		}
		if (importInfo.status !== 'awaitingImport') {
			throw new Error('Import is not in state Awaiting Import. Cannot import.');
		}

		//Mark as importing
		await dbExecuteLogger(
			db
				.update(importTable)
				.set({ status: 'importing', ...updatedTime() })
				.where(eq(importTable.id, id)),
			'Import - Do Import - Update'
		);

		try {
			const importDetails = await dbExecuteLogger(
				db
					.select()
					.from(importItemDetail)
					.where(and(eq(importItemDetail.importId, id), eq(importItemDetail.status, 'processed'))),
				'Import - Do Import - Get Details'
			);

			const startTime = new Date();
			const maxTime = new Date(startTime.getTime() + serverEnv.IMPORT_TIMEOUT_MIN * 60 * 1000);

			await tLogger(
				'Do Import',
				db.transaction(async (trx) => {
					await Promise.all(
						importDetails.map(async (item, index) => {
							if (importInfo.type === 'transaction' || importInfo.type == 'mappedImport') {
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

							logging.debug(
								`Importing item ${index}. Time = ${(new Date().getTime() - startTime.getTime()) / 1000}s`
							);

							if (new Date() > maxTime) {
								trx.rollback();
								throw new Error('Import Timed Out');
							}
						})
					);
				})
			);
			await tActions.reusableFitler.applyFollowingImport({
				db,
				importId: id,
				timeout: maxTime
			});

			await dbExecuteLogger(
				db
					.update(importTable)
					.set({ status: 'complete', ...updatedTime() })
					.where(eq(importTable.id, id)),
				'Import - Do Import - Update Complete'
			);
		} catch (e) {
			//Check if the import is still in the importing state
			const importInfoList = await dbExecuteLogger(
				db.select().from(importTable).where(eq(importTable.id, id)).limit(1),
				'Import - Do Import - Get 2'
			);

			const importInfo = importInfoList[0];

			if (importInfo && importInfo.status === 'importing') {
				//Mark as error

				await dbExecuteLogger(
					db
						.update(importTable)
						.set({ status: 'error', errorInfo: e, ...updatedTime() })
						.where(eq(importTable.id, id)),
					'Import - Do Import - Update Error'
				);
			}
		}
	},
	forgetImport: async ({ db, id }: { db: DBType; id: string }): Promise<void> => {
		await tLogger(
			'Forget Import',
			db.transaction(async (db) => {
				await dbExecuteLogger(
					db.delete(importTable).where(eq(importTable.id, id)),
					'Import - Forget Import - Delete Import Table'
				);
				await dbExecuteLogger(
					db.delete(importItemDetail).where(eq(importItemDetail.importId, id)),
					'Import - Forget Import - Delete Import Details'
				);
				await dbExecuteLogger(
					db.update(journalEntry).set({ importId: null }).where(eq(journalEntry.importId, id)),
					'Import - Forget Import - Update Journal Entry'
				);

				await dbExecuteLogger(
					db
						.update(bill)
						.set({ importId: null, importDetailId: null })
						.where(eq(bill.importId, id)),
					'Import - Forget Import - Update Bill'
				);
				await dbExecuteLogger(
					db
						.update(budget)
						.set({ importId: null, importDetailId: null })
						.where(eq(budget.importId, id)),
					'Import - Forget Import - Update Budget'
				);
				await dbExecuteLogger(
					db
						.update(category)
						.set({ importId: null, importDetailId: null })
						.where(eq(category.importId, id)),
					'Import - Forget Import - Update Category'
				);
				await dbExecuteLogger(
					db.update(tag).set({ importId: null, importDetailId: null }).where(eq(tag.importId, id)),
					'Import - Forget Import - Update Tag'
				);
				await dbExecuteLogger(
					db
						.update(account)
						.set({ importId: null, importDetailId: null })
						.where(eq(account.importId, id)),
					'Import - Forget Import - Update Account'
				);
				await dbExecuteLogger(
					db
						.update(account)
						.set({ importId: null, importDetailId: null })
						.where(eq(account.importId, id)),
					'Import - Forget Import - Update Account'
				);
				await dbExecuteLogger(
					db
						.update(label)
						.set({ importId: null, importDetailId: null })
						.where(eq(label.importId, id)),
					'Import - Forget Import - Update Label'
				);
			})
		);
	},
	canDelete: async ({ db, id }: { db: DBType; id: string }): Promise<boolean> => {
		const importDetails = await dbExecuteLogger(
			db.select().from(importTable).where(eq(importTable.id, id)),
			'Import - Can Delete - Get Details'
		);

		if (!importDetails || importDetails.length === 0) {
			return false;
		}

		const importInfo = importDetails[0];

		if (
			importInfo.status !== 'complete' &&
			importInfo.status !== 'importing' &&
			importInfo.status !== 'awaitingImport'
		) {
			return true;
		} else if (importInfo.type === 'transaction') {
			return true;
		} else if (importInfo.type === 'account') {
			const accounts = await dbExecuteLogger(
				db.select().from(account).where(eq(account.importId, id)),
				'Import - Can Delete - Account'
			);
			return tActions.account.canDeleteMany(
				db,
				accounts.map((item) => item.id)
			);
		} else if (importInfo.type === 'bill') {
			const bills = await dbExecuteLogger(
				db.select().from(bill).where(eq(bill.importId, id)),
				'Import - Can Delete - Bill'
			);
			return tActions.bill.canDeleteMany(
				db,
				bills.map((item) => item.id)
			);
		} else if (importInfo.type === 'budget') {
			const budgets = await dbExecuteLogger(
				db.select().from(budget).where(eq(budget.importId, id)),
				'Import - Can Delete - Budget'
			);
			return tActions.budget.canDeleteMany(
				db,
				budgets.map((item) => item.id)
			);
		} else if (importInfo.type === 'category') {
			const categories = await dbExecuteLogger(
				db.select().from(category).where(eq(category.importId, id)),
				'Import - Can Delete - Category'
			);
			return tActions.category.canDeleteMany(
				db,
				categories.map((item) => item.id)
			);
		} else if (importInfo.type === 'label') {
			const labels = await dbExecuteLogger(
				db.select().from(label).where(eq(label.importId, id)),
				'Import - Can Delete - Label'
			);
			return tActions.label.canDeleteMany(
				db,
				labels.map((item) => item.id)
			);
		} else if (importInfo.type === 'tag') {
			const tags = await dbExecuteLogger(
				db.select().from(tag).where(eq(tag.importId, id)),
				'Import - Can Delete - Tag'
			);
			return tActions.tag.canDeleteMany(
				db,
				tags.map((item) => item.id)
			);
		} else if (importInfo.type === 'mappedImport') {
			return false;
		} else {
			throw new Error('Import Type Error');
		}
	},
	deleteLinked: async ({ db, id }: { db: DBType; id: string }): Promise<void> => {
		const canDelete = await importActions.canDelete({ db, id });

		if (canDelete) {
			const importDetails = await dbExecuteLogger(
				db.query.importTable.findFirst({
					where: eq(importTable.id, id),
					with: {
						bills: true,
						budgets: true,
						categories: true,
						tags: true,
						labels: true,
						journals: true
					}
				}),
				'Import - Delete Linked - Get Details'
			);
			await tLogger(
				'Delete Import Linked Items',
				db.transaction(async (db) => {
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
						await dbExecuteLogger(
							db.delete(importItemDetail).where(eq(importItemDetail.importId, id)),
							'Import - Delete Linked - Delete Details'
						);
						await dbExecuteLogger(
							db.update(importTable).set({ status: 'created' }).where(eq(importTable.id, id)),
							'Import - Delete Linked - Update Import'
						);
					}
				})
			);
		}
	},
	delete: async ({ db, id }: { db: DBType; id: string }): Promise<void> => {
		const canDelete = await importActions.canDelete({ db, id });

		if (canDelete) {
			await tLogger(
				'Import Delete',
				db.transaction(async (db) => {
					await importActions.deleteLinked({ db, id });
					await dbExecuteLogger(
						db.delete(importTable).where(eq(importTable.id, id)),
						'Import - Delete - Delete Import'
					);
				})
			);
		}
	},
	autoCleanAll: async ({ db, retainDays }: { db: DBType; retainDays: number }): Promise<void> => {
		const importsToClean = await dbExecuteLogger(
			db
				.select({ id: importTable.id })
				.from(importTable)
				.where(
					and(
						eq(importTable.status, 'complete'),
						lt(importTable.createdAt, new Date(Date.now() - retainDays * 24 * 60 * 60 * 1000)),
						eq(importTable.autoClean, true)
					)
				),
			'Import - Auto Clean All - Get Imports'
		);

		for (const importToClean of importsToClean) {
			const numberNotImported = await dbExecuteLogger(
				db
					.select({ count: drizzleCount(importItemDetail.id) })
					.from(importItemDetail)
					.where(
						and(
							eq(importItemDetail.importId, importToClean.id),
							not(eq(importItemDetail.status, 'imported'))
						)
					),
				'Import - Auto Clean All - Get Not Imported'
			);
			const numberImported = await dbExecuteLogger(
				db
					.select({ count: drizzleCount(importItemDetail.id) })
					.from(importItemDetail)
					.where(
						and(
							eq(importItemDetail.importId, importToClean.id),
							eq(importItemDetail.status, 'imported')
						)
					),
				'Import - Auto Clean All - Get Imported'
			);

			if (numberNotImported[0].count > 0 || numberImported[0].count === 0) {
				await importActions.clean({ db, id: importToClean.id });
			}
		}
	},
	clean: async ({ db, id }: { db: DBType; id: string }): Promise<void> => {
		const foundImports = await dbExecuteLogger(
			db.select().from(importTable).where(eq(importTable.id, id)),
			'Import - Clean - Get Import'
		);

		if (foundImports.length === 0) {
			return;
		}

		const importToClean = foundImports[0];

		if (importToClean.status !== 'complete') {
			return;
		}

		const numberImported = await dbExecuteLogger(
			db
				.select()
				.from(importItemDetail)
				.where(and(eq(importItemDetail.importId, id), eq(importItemDetail.status, 'imported'))),
			'Import - Clean - Get Imported'
		);

		//When there is no imported items, delete the entire import, when there is some imported, then remove everything that is not "imported"
		if (numberImported.length === 0) {
			await importActions.forgetImport({ db, id });
		} else {
			await dbExecuteLogger(
				db
					.delete(importItemDetail)
					.where(
						and(eq(importItemDetail.importId, id), not(eq(importItemDetail.status, 'imported')))
					),
				'Import - Clean - Delete Not Imported'
			);
		}
	}
};

export type ImportList = ImportSubqueryReturnData;
export type ImportDetailList = GetImportDetailReturnType[];
export type ImportDetail = GetImportDetailReturnType;
