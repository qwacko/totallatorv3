import {
	combinedBackupSchema,
	currentBackupSchema,
	type CurrentBackupSchemaType
} from '$lib/server/backups/backupSchema';
import type { DBType } from '../db';
import {
	user,
	session,
	key,
	account,
	bill,
	budget,
	category,
	transaction,
	journalEntry,
	label,
	labelsToJournals,
	tag,
	importItemDetail,
	importTable,
	importMapping,
	reusableFilter
} from '../schema';
import fs from 'fs/promises';
import { splitArrayIntoChunks } from './helpers/misc/splitArrayIntoChunks';

import { serverEnv } from '$lib/server/serverEnv';
import superjson from 'superjson';
import zlib from 'zlib';

async function writeToMsgPackFile(data: unknown, filePath: string) {
	const compressedConvertedData = zlib.gzipSync(superjson.stringify(data));
	await fs.writeFile(filePath, compressedConvertedData);
}

async function readFromMsgPackFile(filePath: string) {
	const fileData = await fs.readFile(filePath);
	const decompressedFileData = zlib.gunzipSync(fileData);
	return superjson.parse(decompressedFileData.toString());
}

const chunker = async <D, R>(
	arrayData: D[],
	maxSize: number,
	calledFunction: (chunk: D[]) => Promise<R>
): Promise<R[]> => {
	const chunks = splitArrayIntoChunks(arrayData, maxSize);

	return Promise.all(chunks.map(calledFunction));
};

export const backupActions = {
	storeBackup: async ({
		db,
		title = 'Backup',
		compress = true,
		creationReason,
		createdBy
	}: {
		db: DBType;
		title?: string;
		compress?: boolean;
		creationReason: string;
		createdBy: string;
	}) => {
		const date = new Date();
		const filenameUse = `${serverEnv.BACKUP_DIR}/${date.toISOString()}-${title}.${
			compress ? 'data' : 'json'
		}`;

		const backupDataDB: Omit<CurrentBackupSchemaType, 'information'> = {
			version: 1,
			data: {
				user: await db.select().from(user).execute(),
				session: await db.select().from(session).execute(),
				key: await db.select().from(key).execute(),
				account: await db.select().from(account).execute(),
				bill: await db.select().from(bill).execute(),
				budget: await db.select().from(budget).execute(),
				category: await db.select().from(category).execute(),
				tag: await db.select().from(tag).execute(),
				label: await db.select().from(label).execute(),
				labelsToJournals: await db.select().from(labelsToJournals).execute(),
				transaction: await db.select().from(transaction).execute(),
				journalEntry: await db.select().from(journalEntry).execute(),
				importItemDetail: await db.select().from(importItemDetail).execute(),
				importTable: await db.select().from(importTable).execute(),
				importMapping: await db.select().from(importMapping).execute(),
				reusableFilter: await db.select().from(reusableFilter).execute()
			}
		};

		const backupData: CurrentBackupSchemaType = {
			...backupDataDB,
			information: {
				createdAt: date,
				title,
				creationReason,
				createdBy,
				itemCount: {
					numberAccounts: backupDataDB.data.account.length,
					numberBills: backupDataDB.data.bill.length,
					numberBudgets: backupDataDB.data.budget.length,
					numberCategories: backupDataDB.data.category.length,
					numberTransactions: backupDataDB.data.transaction.length,
					numberJournalEntries: backupDataDB.data.journalEntry.length,
					numberLabels: backupDataDB.data.label.length,
					numberLabelsToJournals: backupDataDB.data.labelsToJournals.length,
					numberTags: backupDataDB.data.tag.length,
					numberImportItemDetails: backupDataDB.data.importItemDetail.length,
					numberImportTables: backupDataDB.data.importTable.length,
					numberImportMappings: backupDataDB.data.importMapping.length,
					numberReusableFilters: backupDataDB.data.reusableFilter.length
				}
			}
		};

		const checkedBackupData = currentBackupSchema.parse(backupData);

		if (compress) {
			await writeToMsgPackFile(checkedBackupData, filenameUse);
		} else {
			await fs.writeFile(filenameUse, superjson.stringify(checkedBackupData));
		}
	},
	getBackupData: async ({ returnRaw, filename }: { filename: string; returnRaw: boolean }) => {
		const targetDir = serverEnv.BACKUP_DIR;
		const targetFile = `${targetDir}/${filename}`;

		const backupList = await backupActions.list();

		const backupFile = backupList.find((file) => file.filename === filename);

		if (!backupFile) {
			throw new Error('Backup File Not Found');
		}

		if (returnRaw) {
			return await fs.readFile(targetFile);
		}

		const isCompressed = filename.endsWith('.data');

		const loadedBackupData = isCompressed
			? await readFromMsgPackFile(targetFile)
			: superjson.parse((await fs.readFile(targetFile)).toString());

		return loadedBackupData;
	},
	getBackupDataStrutured: async ({
		filename
	}: {
		filename: string;
	}): Promise<CurrentBackupSchemaType> => {
		const backupData = await backupActions.getBackupData({ filename, returnRaw: false });

		const backupDataParsed = combinedBackupSchema.parse(backupData);

		if (backupDataParsed.version !== 1) {
			throw new Error('Backup Version Mismatch');
		}

		return backupDataParsed;
	},
	deleteBackup: async (backupName: string) => {
		const targetDir = serverEnv.BACKUP_DIR;

		const backupFile = (await fs.readdir(targetDir, { recursive: true })).find(
			(file) => file === backupName
		);

		if (!backupFile) {
			throw new Error('Backup File Not Found');
		}

		await fs.unlink(`${targetDir}/${backupFile}`);

		return;
	},
	restoreBackup: async ({
		db,
		filename,
		includeUsers = false
	}: {
		db: DBType;
		filename: string;
		includeUsers?: boolean;
	}) => {
		const checkedBackupData = await backupActions.getBackupDataStrutured({ filename });

		//Produce a new backup prior to any restore.
		await backupActions.storeBackup({
			db,
			title: `Pre-Restore - ${filename}`,
			compress: true,
			createdBy: 'System',
			creationReason: 'Pre-Restore'
		});

		const dataInsertionStart = Date.now();
		await db.transaction(async (trx) => {
			//Clear The Database
			if (includeUsers) {
				await trx.delete(user).execute();
				await trx.delete(session).execute();
				await trx.delete(key).execute();
			}
			await trx.delete(account).execute();
			await trx.delete(bill).execute();
			await trx.delete(budget).execute();
			await trx.delete(category).execute();
			await trx.delete(tag).execute();
			await trx.delete(label).execute();
			await trx.delete(transaction).execute();
			await trx.delete(journalEntry).execute();
			await trx.delete(labelsToJournals).execute();
			await trx.delete(importMapping).execute();
			await trx.delete(importTable).execute();
			await trx.delete(importItemDetail).execute();
			await trx.delete(reusableFilter).execute();
			console.log(`Deletions Complete: ${Date.now() - dataInsertionStart}ms`);

			//Update Database from Backup
			if (includeUsers) {
				await chunker(checkedBackupData.data.user, 1000, async (data) =>
					trx.insert(user).values(data).execute()
				);
				await chunker(checkedBackupData.data.session, 1000, async (data) =>
					trx.insert(session).values(data).execute()
				);
				await chunker(checkedBackupData.data.key, 1000, async (data) =>
					trx.insert(key).values(data).execute()
				);
			}

			await chunker(checkedBackupData.data.account, 1000, async (data) =>
				trx.insert(account).values(data).execute()
			);
			console.log(`Account Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.bill, 1000, async (data) =>
				trx.insert(bill).values(data).execute()
			);
			console.log(`Bill Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.budget, 1000, async (data) =>
				trx.insert(budget).values(data).execute()
			);
			console.log(`Budget Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.category, 1000, async (data) =>
				trx.insert(category).values(data).execute()
			);
			console.log(`Category Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.tag, 1000, async (data) =>
				trx.insert(tag).values(data).execute()
			);
			console.log(`Tag Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.label, 1000, async (data) =>
				trx.insert(label).values(data).execute()
			);
			console.log(`Label Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.transaction, 1000, async (data) =>
				trx.insert(transaction).values(data).execute()
			);
			console.log(`Transaction Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.journalEntry, 1000, async (data) =>
				trx.insert(journalEntry).values(data).execute()
			);
			console.log(`Journal Entry Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.labelsToJournals, 1000, async (data) =>
				trx.insert(labelsToJournals).values(data).execute()
			);
			console.log(`Labels to Journals Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.importMapping, 1000, async (data) =>
				trx.insert(importMapping).values(data).execute()
			);
			console.log(`Import Mapping Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.importTable, 1000, async (data) =>
				trx.insert(importTable).values(data).execute()
			);
			console.log(`Import Table Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.importItemDetail, 1000, async (data) =>
				trx.insert(importItemDetail).values(data).execute()
			);
			console.log(`Import Item Detail Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.reusableFilter, 1000, async (data) =>
				trx.insert(reusableFilter).values(data).execute()
			);
			console.log(`Reusable Filter Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
		});
	},
	list: async () => {
		const targetDir = serverEnv.BACKUP_DIR;

		const files = await fs.readdir(targetDir, { recursive: true });

		const backupData = await Promise.all(
			files.map(async (file) => {
				const filePath = `${targetDir}/${file}`;
				const stats = await fs.stat(filePath);

				const createdAt = new Date(stats.birthtimeMs);
				const updatedAt = new Date(stats.mtimeMs);
				const createdAtNumber = stats.birthtimeMs;

				return {
					filename: file,
					compressed: file.endsWith('.data'),
					createdAt,
					updatedAt,
					createdAtNumber
				};
			})
		);

		const sortedBackupData = backupData.sort((a, b) => b.createdAtNumber - a.createdAtNumber);

		return sortedBackupData;
	}
};
