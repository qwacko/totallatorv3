import {
	backupSchemaToLatest,
	backupSchemaInfoToLatest,
	combinedBackupSchema,
	currentBackupSchema,
	type CurrentBackupSchemaType,
	type CombinedBackupSchemaType
} from '$lib/server/backups/backupSchema';
import { desc, eq, inArray } from 'drizzle-orm';
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
	reusableFilter,
	filter,
	report,
	filtersToReportConfigs,
	keyValueTable,
	reportElement,
	reportElementConfig,
	backupTable
} from '../postgres/schema';
import { splitArrayIntoChunks } from './helpers/misc/splitArrayIntoChunks';
import superjson from 'superjson';
import zlib from 'zlib';
import { backupFileHandler } from '$lib/server/files/fileHandler';
import { nanoid } from 'nanoid';
import { updatedTime } from './helpers/misc/updatedTime';
import { logging } from '$lib/server/logging';
import { serverEnv } from '$lib/server/serverEnv';

async function writeToMsgPackFile(data: unknown, fileName: string) {
	const compressedConvertedData = zlib.gzipSync(superjson.stringify(data));
	await backupFileHandler.write(fileName, compressedConvertedData);
}

async function readFromMsgPackFile(filename: string) {
	const fileData = await backupFileHandler.readToBuffer(filename);
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
	trimBackups: async ({ db }: { db: DBType }) => {
		const firstBackup = await db.query.backupTable.findFirst({
			orderBy: ({ createdAt }, { asc }) => asc(createdAt)
		});

		if (!firstBackup) {
			return;
		}

		const latestDate = new Date();

		const earliestDate = firstBackup.createdAt;

		function getPreviousSunday(date: Date) {
			const dayOfWeek = date.getDay(); // Sunday - 0, Monday - 1, ..., Saturday - 6
			const difference = dayOfWeek; // Since Sunday is 0, the difference is the same as the dayOfWeek

			// Create a new Date object to avoid mutating the original date
			const previousSunday = new Date(date);
			// Subtract the difference to get the previous Sunday
			previousSunday.setDate(date.getDate() - difference);

			return previousSunday;
		}

		const sundayBeforeEarliestDate = getPreviousSunday(earliestDate);
		const sundayBeforeLatestDate = getPreviousSunday(latestDate);
		//One day earlier to allow for minor differences. All the logic is working in weeks, so a day doesn't impact the outcome.
		sundayBeforeLatestDate.setDate(sundayBeforeLatestDate.getDate() - 1);
		let currentDate = new Date(sundayBeforeEarliestDate);
		const dateOptions: { startDate: Date; endDate: Date }[] = [];

		//Build an array of date ranges to retain at least one back within
		while (currentDate <= sundayBeforeLatestDate) {
			const activeDate = new Date(currentDate);
			const activeDateEnd = new Date(currentDate);
			activeDateEnd.setDate(activeDateEnd.getDate() + 6);

			dateOptions.push({
				startDate: activeDate,
				endDate: activeDateEnd
			});

			currentDate.setDate(currentDate.getDate() + 7);
		}

		const lockedBackups = await db
			.select({ id: backupTable.id, createdAt: backupTable.createdAt })
			.from(backupTable)
			.where(eq(backupTable.locked, true))
			.execute();

		const unlockedBackups = await db
			.select({ id: backupTable.id, createdAt: backupTable.createdAt })
			.from(backupTable)
			.where(eq(backupTable.locked, false))
			.execute();

		const backupsToLock: string[] = [];

		for (const index in dateOptions) {
			const currentDateRange = dateOptions[index];

			const lockedBackupsInDateRange = lockedBackups.filter((backup) => {
				const backupDate = new Date(backup.createdAt);
				return backupDate >= currentDateRange.startDate && backupDate <= currentDateRange.endDate;
			});

			const unlockedBackupsInDateRange = unlockedBackups.filter((backup) => {
				const backupDate = new Date(backup.createdAt);
				return backupDate >= currentDateRange.startDate && backupDate <= currentDateRange.endDate;
			});

			if (lockedBackupsInDateRange.length === 0) {
				if (unlockedBackupsInDateRange.length > 0) {
					const latestUnlockedBackup = unlockedBackupsInDateRange.sort(
						(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					)[0];

					backupsToLock.push(latestUnlockedBackup.id);
				}
			}
		}

		if (backupsToLock.length > 0) {
			await db
				.update(backupTable)
				.set({ locked: true })
				.where(inArray(backupTable.id, backupsToLock))
				.execute();
		}

		const retentionMonths = serverEnv.RETENTION_MONTHS;
		const retentionDate = new Date();
		retentionDate.setMonth(retentionDate.getMonth() - retentionMonths);

		const backupsToDelete = await db.query.backupTable.findMany({
			where: ({ createdAt, locked }, { lte, eq, and }) =>
				and(eq(locked, false), lte(createdAt, retentionDate))
		});

		const numberOfBackups = lockedBackups.length + unlockedBackups.length;

		//Make sure that you are never deleting more than 80% of the backups. If so then don't delete any.
		const percentageToDelete = backupsToDelete.length / numberOfBackups;
		const maxPercentageToDelete = 0.8;

		if (percentageToDelete > maxPercentageToDelete) {
			logging.info(
				`Retention Policy Not Met. Percentage To Delete: ${percentageToDelete}. Max Percentage To Delete: ${maxPercentageToDelete}`
			);
		} else if (backupsToDelete.length > 0) {
			await db.transaction(async (trx) => {
				await Promise.all(
					backupsToDelete.map(async (backup) => {
						await backupActions.deleteBackup({ db: trx, id: backup.id });
					})
				);
			});

			logging.info(`Deleted ${backupsToDelete.length} backups`);
		}
	},
	importFile: async ({ db, backupFile, id }: { db: DBType; backupFile: File; id: string }) => {
		const getFilenameInfo = (filename: string) => {
			const extension = filename.split('.').pop();
			const withoutExtension = extension
				? filename.substring(0, filename.length - extension.length - 1)
				: filename;

			return { extension, withoutExtension, filename };
		};

		//Store backup file into target folder, making sure to rename backup file if there is an existing file with the same name
		let backupFileName = backupFile.name;
		const backupFileExists = await backupFileHandler.fileExists(backupFileName);

		if (backupFileExists) {
			const fileInfo = getFilenameInfo(backupFileName);
			backupFileName = `${fileInfo.withoutExtension}-ImportDuplicate-${new Date().toISOString()}.${fileInfo.extension}`;
		}

		await backupFileHandler.write(backupFileName, Buffer.from(await backupFile.arrayBuffer()));

		try {
			const data = await getBackupStructuredData({ filename: backupFileName });

			const information = {
				version: data.latest.version,
				information: data.latest.information
			};

			const fileInfo = getFilenameInfo(backupFileName);

			await db
				.insert(backupTable)
				.values({
					id,
					title: fileInfo.withoutExtension,
					filename: fileInfo.filename,
					fileExists: true,
					createdAt: new Date(),
					updatedAt: new Date(),
					compressed: backupFileName.endsWith('.data'),
					version: data.originalVersion,
					creationReason: 'Import',
					createdBy: 'User',
					locked: true,
					information
				})
				.execute();
		} catch (e) {
			logging.error(`Backup Import Failed. Incorrect Contents - ${backupFileName}`);
			logging.error('Error', e);
			await backupFileHandler.deleteFile(backupFileName);
			return;
		}

		return id;
	},
	storeBackup: async ({
		db,
		title = 'Backup',
		compress = true,
		creationReason,
		createdBy,
		locked = false
	}: {
		db: DBType;
		title?: string;
		compress?: boolean;
		creationReason: string;
		createdBy: string;
		locked?: boolean;
	}) => {
		const date = new Date();
		const filenameUse = `${date.toISOString()}-${title}.${compress ? 'data' : 'json'}`;

		const backupDataDB: Omit<CurrentBackupSchemaType, 'information'> = {
			version: 5,
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
				reusableFilter: await db.select().from(reusableFilter).execute(),
				filter: await db.select().from(filter).execute(),
				report: await db.select().from(report).execute(),
				filtersToReportConfigs: await db.select().from(filtersToReportConfigs).execute(),
				keyValueTable: await db.select().from(keyValueTable).execute(),
				reportElement: await db.select().from(reportElement).execute(),
				reportElementConfig: await db.select().from(reportElementConfig).execute()
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
					numberReusableFilters: backupDataDB.data.reusableFilter.length,
					numberKeyValues: backupDataDB.data.keyValueTable.length,
					numberReports: backupDataDB.data.report.length,
					numberReportElements: backupDataDB.data.reportElement.length,
					numberReportFilters: backupDataDB.data.filter.length,
					numberReportItems: backupDataDB.data.reportElementConfig.length
				}
			}
		};

		const checkedBackupData = currentBackupSchema.parse(backupData);

		if (compress) {
			await writeToMsgPackFile(checkedBackupData, filenameUse);
		} else {
			await backupFileHandler.write(filenameUse, superjson.stringify(checkedBackupData));
		}

		const information = {
			version: checkedBackupData.version,
			information: checkedBackupData.information
		};

		await db.insert(backupTable).values({
			id: nanoid(),
			title,
			filename: filenameUse,
			fileExists: true,
			updatedAt: date,
			createdAt: date,
			compressed: compress,
			version: checkedBackupData.version,
			creationReason,
			createdBy,
			locked,
			information
		});
	},
	getBackupData: async ({ returnRaw, id, db }: { id: string; returnRaw: boolean; db: DBType }) => {
		const backupFiles = await db.select().from(backupTable).where(eq(backupTable.id, id)).execute();

		if (backupFiles.length === 0) {
			throw new Error('Backup File Not Found In DB');
		}

		const backupFile = backupFiles[0];

		const fileExists = await backupFileHandler.fileExists(backupFile.filename);

		if (!fileExists) {
			await db
				.update(backupTable)
				.set({ fileExists: false })
				.where(eq(backupTable.id, id))
				.execute();
			throw new Error('Backup File Not Found On Disk');
		}
		if (fileExists && backupFile.fileExists === false) {
			await db
				.update(backupTable)
				.set({ fileExists: true })
				.where(eq(backupTable.id, id))
				.execute();
		}

		if (returnRaw) {
			return await backupFileHandler.readToBuffer(backupFile.filename);
		}

		const isCompressed = backupFile.compressed;

		const loadedBackupData = isCompressed
			? await readFromMsgPackFile(backupFile.filename)
			: superjson.parse((await backupFileHandler.readToString(backupFile.filename)).toString());

		return loadedBackupData;
	},
	getBackupDataStrutured: async ({
		id,
		db
	}: {
		id: string;
		db: DBType;
	}): Promise<CurrentBackupSchemaType> => {
		const backupData = await backupActions.getBackupData({ id, returnRaw: false, db });

		const backupDataParsed = combinedBackupSchema.parse(backupData);

		return backupSchemaToLatest(backupDataParsed);
	},
	lock: async ({ id, db }: { id: string; db: DBType }) => {
		await db
			.update(backupTable)
			.set({ locked: true, ...updatedTime() })
			.where(eq(backupTable.id, id))
			.execute();
	},
	unlock: async ({ id, db }: { id: string; db: DBType }) => {
		await db
			.update(backupTable)
			.set({ locked: false, ...updatedTime() })
			.where(eq(backupTable.id, id))
			.execute();
	},
	updateTitle: async ({ id, title, db }: { id: string; title: string; db: DBType }) => {
		await db
			.update(backupTable)
			.set({ title, ...updatedTime() })
			.where(eq(backupTable.id, id))
			.execute();
	},
	deleteBackup: async ({ id, db }: { id: string; db: DBType }) => {
		const backupFilesInDB = await db
			.select()
			.from(backupTable)
			.where(eq(backupTable.id, id))
			.execute();

		const backupFileInDB = backupFilesInDB[0];

		const backupExists = await backupFileHandler.fileExists(backupFileInDB.filename);

		if (backupFileInDB && backupFileInDB.locked) {
			logging.info(`Cannot Delete Backup as it is locked - ${backupFileInDB.filename}`);
			return;
		}

		if (backupExists) {
			await backupFileHandler.deleteFile(backupFileInDB.filename);
		}

		if (backupFilesInDB.length === 1) {
			await db.delete(backupTable).where(eq(backupTable.id, id)).execute();
		}

		return;
	},
	restoreBackup: async ({
		db,
		id,
		includeUsers = false
	}: {
		db: DBType;
		id: string;
		includeUsers?: boolean;
	}) => {
		const backups = await db.select().from(backupTable).where(eq(backupTable.id, id)).execute();
		if (backups.length === 0) {
			throw new Error('Backup Not Found');
		}
		const backup = backups[0];

		const checkedBackupData = await backupActions.getBackupDataStrutured({ id, db });

		//Produce a new backup prior to any restore.
		await backupActions.storeBackup({
			db,
			title: `Pre-Restore - ${backup.createdAt.toISOString().substring(0, 10)} - ${backup.title}`,
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
			await trx.delete(filter).execute();
			await trx.delete(report).execute();
			await trx.delete(filtersToReportConfigs).execute();
			await trx.delete(keyValueTable).execute();
			await trx.delete(reportElement).execute();
			await trx.delete(reportElementConfig).execute();
			logging.info(`Deletions Complete: ${Date.now() - dataInsertionStart}ms`);

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
			logging.info(`Account Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.bill, 1000, async (data) =>
				trx.insert(bill).values(data).execute()
			);
			logging.info(`Bill Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.budget, 1000, async (data) =>
				trx.insert(budget).values(data).execute()
			);
			logging.info(`Budget Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.category, 1000, async (data) =>
				trx.insert(category).values(data).execute()
			);
			logging.info(`Category Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.tag, 1000, async (data) =>
				trx.insert(tag).values(data).execute()
			);
			logging.info(`Tag Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.label, 1000, async (data) =>
				trx.insert(label).values(data).execute()
			);
			logging.info(`Label Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.transaction, 1000, async (data) =>
				trx.insert(transaction).values(data).execute()
			);
			logging.info(`Transaction Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.journalEntry, 1000, async (data) =>
				trx.insert(journalEntry).values(data).execute()
			);
			logging.info(`Journal Entry Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.labelsToJournals, 1000, async (data) =>
				trx.insert(labelsToJournals).values(data).execute()
			);
			logging.info(`Labels to Journals Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.importMapping, 1000, async (data) =>
				trx.insert(importMapping).values(data).execute()
			);
			logging.info(`Import Mapping Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.importTable, 1000, async (data) =>
				trx.insert(importTable).values(data).execute()
			);
			logging.info(`Import Table Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.importItemDetail, 1000, async (data) =>
				trx.insert(importItemDetail).values(data).execute()
			);
			logging.info(`Import Item Detail Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.reusableFilter, 1000, async (data) =>
				trx.insert(reusableFilter).values(data).execute()
			);
			logging.info(`Reusable Filter Insertions Complete: ${Date.now() - dataInsertionStart}ms`);

			await chunker(checkedBackupData.data.filter, 1000, async (data) =>
				trx.insert(filter).values(data).execute()
			);
			logging.info(`Filter Insertions Complete: ${Date.now() - dataInsertionStart}ms`);

			await chunker(checkedBackupData.data.report, 1000, async (data) =>
				trx.insert(report).values(data).execute()
			);
			logging.info(`Report Insertions Complete: ${Date.now() - dataInsertionStart}ms`);

			await chunker(checkedBackupData.data.filtersToReportConfigs, 1000, async (data) =>
				trx.insert(filtersToReportConfigs).values(data).execute()
			);
			logging.info(
				`Filters To Report Configs Insertions Complete: ${Date.now() - dataInsertionStart}ms`
			);

			await chunker(checkedBackupData.data.reportElement, 1000, async (data) =>
				trx.insert(reportElement).values(data).execute()
			);
			logging.info(`Report Element Insertions Complete: ${Date.now() - dataInsertionStart}ms`);

			await chunker(checkedBackupData.data.reportElementConfig, 1000, async (data) =>
				trx.insert(reportElementConfig).values(data).execute()
			);
			logging.info(
				`Report Element Config Insertions Complete: ${Date.now() - dataInsertionStart}ms`
			);

			await chunker(checkedBackupData.data.keyValueTable, 1000, async (data) =>
				trx.insert(keyValueTable).values(data).execute()
			);
			logging.info(`Key Value Table Insertions Complete: ${Date.now() - dataInsertionStart}ms`);

			//Mark the backup as having a restored date.
			await trx
				.update(backupTable)
				.set({ restoreDate: new Date(), ...updatedTime() })
				.where(eq(backupTable.id, id))
				.execute();
		});
	},
	refreshList: async ({ db }: { db: DBType }) => {
		const [backupsInDB, backupFiles] = await Promise.all([
			db.select().from(backupTable).execute(),
			backupFileHandler.list('')
		]);

		const DBFilenames = backupsInDB.map((backup) => backup.filename);
		const DBFilenamesWithoutFiles = backupsInDB
			.filter((backup) => !backup.fileExists)
			.map((backup) => backup.filename);
		const DBFilenamesWithFiles = backupsInDB
			.filter((backup) => backup.fileExists)
			.map((backup) => backup.filename);
		const fileFilenames = (await backupFiles.toArray()).map((file) => file.path);

		const filesInDBButNotInFiles = DBFilenamesWithFiles.filter(
			(filename) => !fileFilenames.includes(filename)
		);
		const filesNotExistInDBButExistInFiles = DBFilenamesWithoutFiles.filter((filename) =>
			fileFilenames.includes(filename)
		);
		const filesNotInDB = fileFilenames.filter((filename) => !DBFilenames.includes(filename));

		//Mark Files In DB But Not In Files AS Not File Exists
		await Promise.all(
			filesInDBButNotInFiles.map((filename) =>
				db
					.update(backupTable)
					.set({ fileExists: false })
					.where(eq(backupTable.filename, filename))
					.execute()
			)
		);

		//Mark Files in DB BUt Not Exists that do exist as file exists
		await Promise.all(
			filesNotExistInDBButExistInFiles.map((filename) =>
				db
					.update(backupTable)
					.set({ fileExists: true })
					.where(eq(backupTable.filename, filename))
					.execute()
			)
		);

		//Create Files In DB That Are Missing In DB
		for (const filename of filesNotInDB) {
			const index = fileFilenames.indexOf(filename);

			const start = new Date();

			const backupInfo = await getBackupStructuredData({ filename });

			const version = backupInfo.originalVersion;

			const information = {
				version: backupInfo.latest.version,
				information: backupInfo.latest.information
			};

			const filenameDate = filename.substring(0, 10);
			const filenameTitle = filename.substring(11);

			await db
				.insert(backupTable)
				.values({
					id: nanoid(),
					title: filenameTitle,
					filename,
					fileExists: true,
					createdAt: new Date(filenameDate),
					updatedAt: new Date(filenameDate),
					compressed: filename.endsWith('.data'),
					version,
					creationReason: 'Appears In File System',
					createdBy: 'Automatically',
					locked: false,
					information
				})
				.execute();
			const end = new Date();
			logging.info(
				`File ${index + 1} of ${filesNotInDB.length} took ${end.getTime() - start.getTime()}ms`
			);
		}
	},
	list: async ({ db }: { db: DBType }) => {
		const listData = await db
			.select()
			.from(backupTable)
			.orderBy(desc(backupTable.createdAt))
			.execute();

		return listData.map((data) => ({
			...data,
			information: backupSchemaInfoToLatest(data.information)
		}));
	},
	getBackupInfo: async ({ db, id }: { db: DBType; id: string }) => {
		const data = await db.select().from(backupTable).where(eq(backupTable.id, id)).execute();
		if (data.length === 0) {
			return undefined;
		}

		return { ...data[0], information: backupSchemaInfoToLatest(data[0].information) };
	},
	getBackupInfoByFilename: async ({ db, filename }: { db: DBType; filename: string }) => {
		const data = await db
			.select()
			.from(backupTable)
			.where(eq(backupTable.filename, filename))
			.execute();
		if (data.length === 0) {
			return undefined;
		}

		return backupActions.getBackupInfo({ db, id: data[0].id });
	}
};

const getBackupStructuredData = async ({ filename }: { filename: string }) => {
	const backupExists = await backupFileHandler.fileExists(filename);

	if (!backupExists) {
		throw new Error('Backup File Not Found On Disk');
	}

	const isCompressed = filename.endsWith('.data');

	const loadedBackupData = isCompressed
		? ((await readFromMsgPackFile(filename)) as CombinedBackupSchemaType)
		: (superjson.parse(
				(await backupFileHandler.readToString(filename)).toString()
			) as CombinedBackupSchemaType);

	const backupDataParsed = combinedBackupSchema.parse(loadedBackupData);

	return {
		latest: backupSchemaToLatest(backupDataParsed),
		original: loadedBackupData,
		originalVersion: loadedBackupData.version
	};
};
