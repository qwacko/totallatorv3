import { and, count as drizzleCount, eq, lt, not } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';

import { getContextDB, runInTransactionWithLogging } from '@totallator/context';
import {
	account,
	autoImportTable,
	type AutoImportTableType,
	bill,
	budget,
	category,
	importItemDetail,
	importMapping,
	type ImportMappingTableType,
	importTable,
	type ImportTableType,
	journalEntry,
	label,
	tag
} from '@totallator/database';
import {
	type CreateImportSchemaType,
	type ImportFilterSchemaType,
	type UpdateImportSchemaType
} from '@totallator/shared';

import { getLogger } from '@/logger';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { getServerEnv } from '@/serverEnv';

import { filterNullUndefinedAndDuplicates } from '../helpers/filterNullUndefinedAndDuplicates';
import { importFileHandler } from '../server/files/fileHandler';
// import { processCreatedImport } from './helpers/import/processImport';
import { streamingDelay } from '../server/testingDelay';
import { accountActions } from './accountActions';
import { billActions } from './billActions';
import { budgetActions } from './budgetActions';
import { categoryActions } from './categoryActions';
import { getImportDetail, type GetImportDetailReturnType } from './helpers/import/getImportDetail';
import { importFilterToQuery } from './helpers/import/importFilterToQuery';
import {
	importAccount,
	importBill,
	importBudget,
	importCategory,
	importLabel,
	importTag
} from './helpers/import/importHelpers';
import { importTransaction } from './helpers/import/importHelpers_importTransaction';
import {
	importListSubquery,
	type ImportSubqueryReturnData
} from './helpers/import/importListSubquery';
import { importToOrderByToSQL } from './helpers/import/importOrderByToSQL';
import { processCreatedImport } from './helpers/import/processImport';
import type { PaginatedResults } from './helpers/journal/PaginationType';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { updatedTime } from './helpers/misc/updatedTime';
import { importMappingActions } from './importMappingActions';
import { journalActions } from './journalActions';
import { labelActions } from './labelActions';
import { reusableFilterActions } from './reusableFilterActions';
import { tagActions } from './tagActions';

export const importActions = {
	numberActive: async (): Promise<number> => {
		const db = getContextDB();
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
		filter
	}: {
		filter: ImportFilterSchemaType;
	}): Promise<PaginatedResults<ImportSubqueryReturnData>> => {
		const db = getContextDB();
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const internalQuery = importListSubquery(db);

		const where = importFilterToQuery({
			filter: restFilter,
			query: internalQuery
		});

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
		filter
	}: {
		filter: ImportFilterSchemaType;
	}): Promise<
		PaginatedResults<ImportSubqueryReturnData> & {
			details: GetImportDetailReturnType[];
		}
	> => {
		const db = getContextDB();
		const imports = await importActions.list({ filter });

		const importDetails = await Promise.all(
			imports.data.map(async (item) => {
				return getImportDetail({ db, id: item.id });
			})
		);

		return { ...imports, details: importDetails };
	},
	update: async ({ data }: { data: UpdateImportSchemaType }): Promise<void> => {
		const db = getContextDB();
		const { id, ...restData } = data;

		await dbExecuteLogger(
			db.update(importTable).set(restData).where(eq(importTable.id, id)),
			'Import - Update'
		);
	},
	store: async ({
		data,
		autoImportId
	}: {
		data: CreateImportSchemaType;
		autoImportId?: string;
	}): Promise<string> => {
		const startTime = Date.now();
		const db = getContextDB();
		const { file: newFile, importType: type, ...restData } = data;

		getLogger('import').info({
			code: 'IMP_050',
			title: 'Starting import file storage',
			filename: newFile.name,
			fileSize: newFile.size,
			fileType: newFile.type,
			importType: type,
			autoImportId
		});

		if (newFile.type !== 'text/csv') {
			if (type !== 'mappedImport') {
				getLogger('import').error({
					code: 'IMP_051',
					title: 'Invalid file type for import type',
					fileType: newFile.type,
					importType: type
				});
				throw new Error('Filetype must be CSV except for mapped imports');
			}

			getLogger('import').debug({
				code: 'IMP_052',
				title: 'Processing JSON file for mapped import'
			});

			const fileString = await newFile.text();
			const jsonFile = JSON.parse(fileString);
			const schemaValidation = z.array(z.record(z.string(), z.any()));
			const parsedData = schemaValidation.safeParse(jsonFile);

			if (!parsedData.success) {
				getLogger('import').error({
					code: 'IMP_053',
					title: 'Invalid JSON format in file',
					error: parsedData.error
				});
				throw new Error('Filetype must be CSV or JSON Array of Objects');
			}

			getLogger('import').info({
				code: 'IMP_054',
				title: 'JSON file validated successfully',
				recordCount: parsedData.data.length
			});
		}

		const fileType = newFile.type === 'text/csv' ? 'csv' : 'json';

		if (type === 'mappedImport' && !importMapping) {
			getLogger('import').error({
				code: 'IMP_055',
				title: 'No mapping selected for mapped import'
			});
			throw new Error('No Mapping Selected');
		}

		if (restData.importMappingId) {
			getLogger('import').debug({
				code: 'IMP_056',
				title: 'Validating import mapping',
				mappingId: restData.importMappingId
			});

			const result = await importMappingActions.getById({
				id: restData.importMappingId
			});
			if (!result) {
				getLogger('import').error({
					code: 'IMP_057',
					title: 'Import mapping not found',
					mappingId: restData.importMappingId
				});
				throw new Error(`Mapping ${importMapping} Not Found`);
			}

			getLogger('import').debug({
				code: 'IMP_058',
				title: 'Import mapping validated successfully',
				mappingId: restData.importMappingId
			});
		}

		const originalFilename = newFile.name;
		const id = nanoid();
		const dateTime = new Date().toISOString().slice(0, 10);

		const saveFilename = `${dateTime}_${id}_${originalFilename}`;

		getLogger('import').debug({
			code: 'IMP_059',
			title: 'Saving import file to storage',
			saveFilename,
			fileType
		});

		await importFileHandler().write(
			saveFilename,
			fileType === 'json' ? Buffer.from(await newFile.arrayBuffer()) : await newFile.text()
		);

		getLogger('import').debug({
			code: 'IMP_060',
			title: 'File saved, creating import record',
			importId: id
		});

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

		getLogger('import').info({
			code: 'IMP_061',
			title: 'Import record created, starting processing',
			importId: id
		});

		try {
			await processCreatedImport({ id });

			const duration = Date.now() - startTime;
			getLogger('import').info({
				code: 'IMP_062',
				title: 'Import processing completed successfully',
				importId: id,
				duration
			});
		} catch (e) {
			getLogger('import').error({
				code: 'IMP_063',
				title: 'Error processing import',
				error: e,
				importId: id
			});
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
	get: async ({
		id
	}: {
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
		const db = getContextDB();
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
	getDetail: async ({ id }: { id: string }): Promise<GetImportDetailReturnType> => {
		const db = getContextDB();
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
			try {
				await processCreatedImport({ id });
			} catch (e) {
				getLogger('import').error({
					code: 'IMP_002',
					title: 'Error Processing Import',
					error: e
				});
				await dbExecuteLogger(
					db
						.update(importTable)
						.set({ status: 'error', errorInfo: e })
						.where(eq(importTable.id, id)),
					'Import - Get - Error Processing Import'
				);
			}
		}

		return getImportDetail({ db, id });
	},
	reprocess: async ({ id }: { id: string }): Promise<void> => {
		const db = getContextDB();
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

		await runInTransactionWithLogging('Reprocess Import', async () => {
			const db = getContextDB();
			await dbExecuteLogger(
				db
					.update(importTable)
					.set({ status: 'created', errorInfo: null, ...updatedTime() })
					.where(eq(importTable.id, id)),
				'Import - Reprocess - Update Import'
			);

			await dbExecuteLogger(
				db.delete(importItemDetail).where(eq(importItemDetail.importId, id)),
				'Import - Reprocess - Delete Details'
			);
		});
	},
	triggerImport: async ({ id }: { id: string }): Promise<void> => {
		const startTime = Date.now();
		const db = getContextDB();

		getLogger('import').info({
			code: 'IMP_070',
			title: 'Starting import trigger process',
			importId: id
		});

		try {
			const importInfoList = await dbExecuteLogger(
				db.select().from(importTable).where(eq(importTable.id, id)),
				'Import - Trigger Import - Get'
			);

			const importInfo = importInfoList[0];
			if (!importInfo) {
				getLogger('import').error({
					code: 'IMP_071',
					title: 'Import not found for trigger',
					importId: id
				});
				throw new Error('Import Not Found');
			}

			getLogger('import').debug({
				code: 'IMP_072',
				title: 'Import found for triggering',
				importId: id,
				status: importInfo.status,
				type: importInfo.type
			});

			if (importInfo.status !== 'processed') {
				getLogger('import').error({
					code: 'IMP_073',
					title: 'Import not in correct status for triggering',
					importId: id,
					currentStatus: importInfo.status,
					requiredStatus: 'processed'
				});
				throw new Error('Import is not in state Processed. Cannot trigger import.');
			}

			await dbExecuteLogger(
				db
					.update(importTable)
					.set({ status: 'awaitingImport', ...updatedTime() })
					.where(eq(importTable.id, id)),
				'Import - Trigger Import - Update'
			);

			const duration = Date.now() - startTime;
			getLogger('import').info({
				code: 'IMP_074',
				title: 'Import trigger completed successfully',
				importId: id,
				duration
			});
		} catch (e) {
			const duration = Date.now() - startTime;
			getLogger('import').error({
				code: 'IMP_075',
				title: 'Import trigger failed',
				error: e,
				importId: id,
				duration
			});
			await db
				.update(importTable)
				.set({ status: 'error', errorInfo: e })
				.where(eq(importTable.id, id));
		}
	},
	doRequiredImports: async (): Promise<void> => {
		const db = getContextDB();
		const importTimeoutms = getServerEnv().IMPORT_TIMEOUT_MIN * 60 * 1000;
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
						.set({
							status: 'error',
							errorInfo: 'Import Timed Out',
							...updatedTime()
						})
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
				await importActions.doImport({ id: item.id });
			})
		);
	},
	doImport: async ({ id }: { id: string }): Promise<void> => {
		const db = getContextDB();
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
			const maxTime = new Date(startTime.getTime() + getServerEnv().IMPORT_TIMEOUT_MIN * 60 * 1000);

			await runInTransactionWithLogging('Do Import', async (trx) => {
				for (let index = 0; index < importDetails.length; index++) {
					const item = importDetails[index];
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

					getLogger('import').debug({
						code: 'IMP_001',
						title: `Importing item ${index}. Time = ${(new Date().getTime() - startTime.getTime()) / 1000}s`
					});

					if (new Date() > maxTime) {
						throw new Error('Import Timed Out');
					}
				}
			});

			// Logic to only run the actions following import if there was actually an item created.
			const numberItems = await db.query.journalEntry.findFirst({
				where: (journalEntry) => eq(journalEntry.importId, id)
			});

			if (numberItems) {
				await reusableFilterActions.applyFollowingImport({
					importId: id,
					timeout: maxTime
				});
			}

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
	forgetImport: async ({ id }: { id: string }): Promise<void> => {
		await runInTransactionWithLogging('Forget Import', async () => {
			const db = getContextDB();
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
				db.update(bill).set({ importId: null, importDetailId: null }).where(eq(bill.importId, id)),
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
		});
	},
	canDelete: async ({ id }: { id: string }): Promise<boolean> => {
		const db = getContextDB();
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
			return accountActions.canDeleteMany(accounts.map((item) => item.id));
		} else if (importInfo.type === 'bill') {
			const bills = await dbExecuteLogger(
				db.select().from(bill).where(eq(bill.importId, id)),
				'Import - Can Delete - Bill'
			);
			return billActions.canDeleteMany(bills.map((item) => item.id));
		} else if (importInfo.type === 'budget') {
			const budgets = await dbExecuteLogger(
				db.select().from(budget).where(eq(budget.importId, id)),
				'Import - Can Delete - Budget'
			);
			return budgetActions.canDeleteMany(budgets.map((item) => item.id));
		} else if (importInfo.type === 'category') {
			const categories = await dbExecuteLogger(
				db.select().from(category).where(eq(category.importId, id)),
				'Import - Can Delete - Category'
			);
			return categoryActions.canDeleteMany(categories.map((item) => item.id));
		} else if (importInfo.type === 'label') {
			const labels = await dbExecuteLogger(
				db.select().from(label).where(eq(label.importId, id)),
				'Import - Can Delete - Label'
			);
			return labelActions.canDeleteMany(labels.map((item) => item.id));
		} else if (importInfo.type === 'tag') {
			const tags = await dbExecuteLogger(
				db.select().from(tag).where(eq(tag.importId, id)),
				'Import - Can Delete - Tag'
			);
			return tagActions.canDeleteMany(tags.map((item) => item.id));
		} else if (importInfo.type === 'mappedImport') {
			return false;
		} else {
			throw new Error('Import Type Error');
		}
	},
	deleteLinked: async ({ id }: { id: string }): Promise<void> => {
		const db = getContextDB();
		const canDelete = await importActions.canDelete({ id });

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
			await runInTransactionWithLogging('Delete Import Linked Items', async () => {
				if (importDetails) {
					const transactionIds = filterNullUndefinedAndDuplicates(
						importDetails.journals.map((item) => item.transactionId)
					);
					await journalActions.hardDeleteTransactions({ transactionIds });

					await billActions.deleteMany(importDetails.bills.map((item) => ({ id: item.id })));
					await budgetActions.deleteMany(importDetails.budgets.map((item) => ({ id: item.id })));
					await categoryActions.deleteMany(
						importDetails.categories.map((item) => ({ id: item.id }))
					);
					await tagActions.deleteMany(importDetails.tags.map((item) => ({ id: item.id })));
					await labelActions.hardDeleteMany(importDetails.labels.map((item) => ({ id: item.id })));
					const db = getContextDB();
					await dbExecuteLogger(
						db.delete(importItemDetail).where(eq(importItemDetail.importId, id)),
						'Import - Delete Linked - Delete Details'
					);
					await dbExecuteLogger(
						db.update(importTable).set({ status: 'created' }).where(eq(importTable.id, id)),
						'Import - Delete Linked - Update Import'
					);
				}
			});
		}
	},
	delete: async ({ id }: { id: string }): Promise<void> => {
		const canDelete = await importActions.canDelete({ id });

		if (canDelete) {
			await runInTransactionWithLogging('Import Delete', async () => {
				await importActions.deleteLinked({ id });
				const db = getContextDB();
				await dbExecuteLogger(
					db.delete(importTable).where(eq(importTable.id, id)),
					'Import - Delete - Delete Import'
				);
			});
		}
	},
	autoCleanAll: async ({ retainDays }: { retainDays: number }): Promise<void> => {
		const db = getContextDB();
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
				await importActions.clean({ id: importToClean.id });
			}
		}
	},
	clean: async ({ id }: { id: string }): Promise<void> => {
		const db = getContextDB();
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
			await importActions.forgetImport({ id });
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
