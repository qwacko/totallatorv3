import { logging } from '$lib/server/logging';
import { serverEnv } from '$lib/server/serverEnv';
import { nanoid } from 'nanoid';
import { writeFileSync, readFileSync } from 'fs';
import type { DBType } from '../db';
import { importItemDetail, importTable } from '../schema';
import { updatedTime } from './helpers/updatedTime';
import { eq } from 'drizzle-orm';
import Papa from 'papaparse';
import { createSimpleTransactionSchema } from '$lib/schema/journalSchema';

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
				complete: false,
				source: 'csv',
				type: 'transaction',
				error: undefined,
				processed: false
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

		if (!importData.processed) {
			const file = readFileSync(importData.filename);

			if (importData.source === 'csv') {
				const processedData = Papa.parse(file.toString(), { header: true, skipEmptyLines: true });

				if (processedData.errors && processedData.errors.lenght > 0) {
					await db
						.update(importTable)
						.set({
							processed: true,
							error: true,
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
											isDuplicate: false,
											isError: false,
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
											isDuplicate: false,
											isError: true,
											processedInfo: row,
											errorInfo: validatedData.error,
											importId: id
										})
										.execute();
								}
							})
						);
					}
					//Mark As Processed
					await db
						.update(importTable)
						.set({ processed: true, ...updatedTime() })
						.where(eq(importTable.id, id))
						.execute();
				}
			}
		}

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

		if (importData.complete) {
			throw new Error('Import Complete. Cannot Reprocess');
		}

		await db.transaction(async (trx) => {
			await trx
				.update(importTable)
				.set({ processed: false, error: false, errorInfo: null, ...updatedTime() })
				.where(eq(importTable.id, id))
				.execute();

			await trx.delete(importItemDetail).where(eq(importItemDetail.importId, id)).execute();
		});
	}
};
