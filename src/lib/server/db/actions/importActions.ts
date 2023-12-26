import { logging } from '$lib/server/logging';
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
import { eq, and, getTableColumns, desc, sql } from 'drizzle-orm';
import { tActions } from './tActions';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
import type { ZodSchema } from 'zod';
import { importTypeEnum, type importTypeType } from '$lib/schema/importSchema';
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
		importMapping,
		checkImportedOnly = false
	}: {
		db: DBType;
		newFile: File;
		type: importTypeType;
		importMapping: string | undefined;
		checkImportedOnly?: boolean;
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
				type,
				checkImportedOnly
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
		await streamingDelay();
		const data = await db.select().from(importTable).where(eq(importTable.id, id));

		if (!data.length) {
			throw new Error('Import Not Found');
		}

		const importData = data[0];

		if (importData.status === 'created') {
			await processCreatedImport({ db, id, importData });
		}

		return getImportDetail({ db, id });
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
