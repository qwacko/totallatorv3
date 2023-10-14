import { logging } from '$lib/server/logging';
import { serverEnv } from '$lib/server/serverEnv';
import { nanoid } from 'nanoid';
import { writeFileSync, readFileSync } from 'fs';
import type { DBType } from '../db';
import { importItemDetail, importTable, transaction } from '../schema';
import { updatedTime } from './helpers/updatedTime';
import { eq, and } from 'drizzle-orm';
import Papa from 'papaparse';
import {
	createCombinedTransactionSchema,
	createSimpleTransactionSchema,
	type CreateCombinedTransactionType,
	type CreateSimpleTransactionType
} from '$lib/schema/journalSchema';
import { tActions } from './tActions';

export const importActions = {
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
						await Promise.all(
							processedData.data.map(async (row) => {
								const validatedData = createSimpleTransactionSchema.safeParse(row);
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
					}
				}
			}
		}

		await db
			.update(importTable)
			.set({ status: 'processed', ...updatedTime() })
			.execute();

		if (importData.type === 'transaction') {
			return {
				type: 'transaction',
				detail: await db.query.importTable
					.findFirst({
						where: eq(importTable.id, id),
						with: { importDetails: { with: { journal: true, journal2: true } } }
					})
					.execute()
			};
		}

		throw new Error('Error Retrieving Import Information');
	},
	reprocess: async ({ db, id }: { db: DBType; id: string }) => {
		const item = await db.select().from(importTable).where(eq(importTable.id, id));

		if (!item.length) {
			throw new Error('Import Not Found');
		}

		const importData = item[0];

		if (importData.status === 'complete') {
			throw new Error('Import Complete. Cannot Reprocess');
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
		const importDetails = await db
			.select()
			.from(importItemDetail)
			.where(and(eq(importItemDetail.importId, id), eq(importItemDetail.status, 'processed')));

		await db.transaction(async (trx) => {
			await Promise.all(
				importDetails.map(async (item) => {
					const processedItem = createSimpleTransactionSchema.safeParse(item.processedInfo);
					if (processedItem.success) {
						const combinedTransaction = simpleSchemaToCombinedSchema(processedItem.data);
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
				})
			);

			await db
				.update(importTable)
				.set({ status: 'complete', ...updatedTime() })
				.where(eq(importTable.id, id))
				.execute();
		});
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
