import { serverEnv } from '$lib/server/serverEnv';
import { nanoid } from 'nanoid';
import { writeFileSync } from 'fs';
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

import { getImportDetail } from './helpers/import/getImportDetail';
import { processCreatedImport } from './helpers/import/processImport';
import { streamingDelay } from '$lib/server/testingDelay';
import { importListSubquery } from './helpers/import/importListSubquery';
import { importToOrderByToSQL } from './helpers/import/importOrderByToSQL';
import { importFilterToQuery } from './helpers/import/importFilterToQuery';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';

export const importActions = {
	numberActive: async (db: DBType) => {
		const result = await db
			.select({ count: drizzleCount(importTable.id) })
			.from(importTable)
			.where(inArrayWrapped(importTable.status, ['importing', 'awaitingImport']))
			.execute();

		return result[0].count;
	},
	list: async ({ db, filter }: { db: DBType; filter: ImportFilterSchemaType }) => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const internalQuery = importListSubquery(db);

		const where = importFilterToQuery({ filter: restFilter, query: internalQuery });

		const results = await db
			.select()
			.from(internalQuery)
			.where(and(...where))
			.limit(pageSize)
			.offset(page * pageSize)
			.orderBy(...importToOrderByToSQL({ query: internalQuery, orderBy }))
			.execute();

		const resultCount = await db
			.select({ count: drizzleCount(internalQuery.id) })
			.from(internalQuery)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
	},
	update: async ({ db, data }: { db: DBType; data: UpdateImportSchemaType }) => {
		const { id, ...restData } = data;

		await db.update(importTable).set(restData).where(eq(importTable.id, id)).execute();
	},
	store: async ({
		db,
		data,
		autoImportId
	}: {
		db: DBType;
		data: CreateImportSchemaType;
		autoImportId?: string;
	}) => {
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
				source: fileType,
				autoImportId,
				type,
				...restData
			})
			.execute();

		await processCreatedImport({ db, id });

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
					const unqiueIdentifier = getUniqueIdentifier
						? getUniqueIdentifier(validatedData.data)
						: undefined;
					const foundUniqueIdentifiers =
						checkUniqueIdentifiers && unqiueIdentifier
							? await checkUniqueIdentifiers([unqiueIdentifier])
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
								importId: id,
								uniqueId: unqiueIdentifier
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
								importId: id,
								uniqueId: unqiueIdentifier
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
							errorInfo: { errors: validatedData.error.errors.map((e) => e.message) },
							importId: id
						})
						.execute();
				}
			})
		);
	},
	get: async ({ id, db }: { db: DBType; id: string }) => {
		const data = await db
			.select()
			.from(importTable)
			.leftJoin(importMapping, eq(importMapping.id, importTable.importMappingId))
			.where(eq(importTable.id, id));

		if (data.length === 0) {
			return { importInfo: undefined };
		}

		return { importInfo: data[0] };
	},
	getDetail: async ({ db, id }: { db: DBType; id: string }) => {
		await streamingDelay();
		const data = await db.select().from(importTable).where(eq(importTable.id, id));

		if (!data.length) {
			throw new Error('Import Not Found');
		}

		const importData = data[0];

		if (importData.status === 'created') {
			await processCreatedImport({ db, id });
		}

		return getImportDetail({ db, id });
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

		if (importData.status === 'importing' || importData.status === 'awaitingImport') {
			throw new Error('Import Currently Importing. Cannot Reprocess');
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
	triggerImport: async ({ db, id }: { db: DBType; id: string }) => {
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
			throw new Error('Import is not in state Processed. Cannot trigger import.');
		}

		await db
			.update(importTable)
			.set({ status: 'awaitingImport', ...updatedTime() })
			.where(eq(importTable.id, id))
			.execute();
	},
	doRequiredImports: async ({ db }: { db: DBType }) => {
		const importTimeoutms = serverEnv.IMPORT_TIMEOUT_MIN * 60 * 1000;
		const earliestUpdatedAt = new Date(Date.now() - importTimeoutms);

		//Upate All Imports That Are Set To Auto Process to Awaiting Import
		await db
			.update(importTable)
			.set({ status: 'awaitingImport', ...updatedTime() })
			.where(and(eq(importTable.status, 'processed'), eq(importTable.autoProcess, true)))
			.execute();

		const numberImportingTooLong = await db
			.select()
			.from(importTable)
			.where(and(eq(importTable.status, 'importing'), lt(importTable.updatedAt, earliestUpdatedAt)))
			.execute();

		await Promise.all(
			numberImportingTooLong.map(async (item) => {
				await db
					.update(importTable)
					.set({ status: 'error', errorInfo: 'Import Timed Out', ...updatedTime() })
					.where(eq(importTable.id, item.id))
					.execute();
			})
		);

		const numberImporting = await db
			.select()
			.from(importTable)
			.where(eq(importTable.status, 'importing'))
			.execute();

		//Only One Import Should Be Executing At A Time
		if (numberImporting.length > 0) {
			return;
		}

		const importDetails = await db
			.select()
			.from(importTable)
			.where(eq(importTable.status, 'awaitingImport'))
			.limit(1)
			.execute();

		await Promise.all(
			importDetails.map(async (item) => {
				await importActions.doImport({ db, id: item.id });
			})
		);
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
		if (importInfo.status !== 'awaitingImport') {
			throw new Error('Import is not in state Awaiting Import. Cannot import.');
		}

		//Mark as importing
		await db
			.update(importTable)
			.set({ status: 'importing', ...updatedTime() })
			.where(eq(importTable.id, id))
			.execute();

		try {
			const importDetails = await db
				.select()
				.from(importItemDetail)
				.where(and(eq(importItemDetail.importId, id), eq(importItemDetail.status, 'processed')));

			const startTime = new Date();
			const maxTime = new Date(startTime.getTime() + serverEnv.IMPORT_TIMEOUT_MIN * 60 * 1000);

			await db.transaction(async (trx) => {
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

						console.log(
							`Importing item ${index}. Time = ${(new Date().getTime() - startTime.getTime()) / 1000}s`
						);

						if (new Date() > maxTime) {
							trx.rollback();
							throw new Error('Import Timed Out');
						}
					})
				);
				await tActions.reusableFitler.applyFollowingImport({
					db: trx,
					importId: id,
					timeout: maxTime
				});

				await trx
					.update(importTable)
					.set({ status: 'complete', ...updatedTime() })
					.where(eq(importTable.id, id))
					.execute();
			});
		} catch (e) {
			//Check if the import is still in the importing state
			const importInfoList = await db
				.select()
				.from(importTable)
				.where(eq(importTable.id, id))
				.limit(1)
				.execute();

			const importInfo = importInfoList[0];

			if (importInfo && importInfo.status === 'importing') {
				//Mark as error

				await db
					.update(importTable)
					.set({ status: 'error', errorInfo: e, ...updatedTime() })
					.where(eq(importTable.id, id))
					.execute();
			}
		}
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

		if (
			importInfo.status !== 'complete' &&
			importInfo.status !== 'importing' &&
			importInfo.status !== 'awaitingImport'
		) {
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
	},
	autoCleanAll: async ({ db, retainDays }: { db: DBType; retainDays: number }) => {
		const importsToClean = await db
			.select({ id: importTable.id })
			.from(importTable)
			.where(
				and(
					eq(importTable.status, 'complete'),
					lt(importTable.createdAt, new Date(Date.now() - retainDays * 24 * 60 * 60 * 1000)),
					eq(importTable.autoClean, true)
				)
			)
			.execute();

		for (const importToClean of importsToClean) {
			const numberNotImported = await db
				.select({ count: drizzleCount(importItemDetail.id) })
				.from(importItemDetail)
				.where(
					and(
						eq(importItemDetail.importId, importToClean.id),
						not(eq(importItemDetail.status, 'imported'))
					)
				)
				.execute();
			const numberImported = await db
				.select({ count: drizzleCount(importItemDetail.id) })
				.from(importItemDetail)
				.where(
					and(
						eq(importItemDetail.importId, importToClean.id),
						eq(importItemDetail.status, 'imported')
					)
				)
				.execute();

			if (numberNotImported[0].count > 0 || numberImported[0].count === 0) {
				await importActions.clean({ db, id: importToClean.id });
			}
		}
	},
	clean: async ({ db, id }: { db: DBType; id: string }) => {
		const foundImports = await db
			.select()
			.from(importTable)
			.where(eq(importTable.id, id))
			.execute();

		if (foundImports.length === 0) {
			return;
		}

		const importToClean = foundImports[0];

		if (importToClean.status !== 'complete') {
			return;
		}

		const numberImported = await db
			.select()
			.from(importItemDetail)
			.where(and(eq(importItemDetail.importId, id), eq(importItemDetail.status, 'imported')))
			.execute();

		//When there is no imported items, delete the entire import, when there is some imported, then remove everything that is not "imported"
		if (numberImported.length === 0) {
			await importActions.forgetImport({ db, id });
		} else {
			await db
				.delete(importItemDetail)
				.where(and(eq(importItemDetail.importId, id), not(eq(importItemDetail.status, 'imported'))))
				.execute();
		}
	}
};
