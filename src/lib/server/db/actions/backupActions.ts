import {
	backupSchemaToLatest,
	backupSchemaInfoToLatest,
	combinedBackupSchema,
	currentBackupSchema,
	type CurrentBackupSchemaType,
	type CombinedBackupSchemaType,
	combinedBackupInfoSchema
} from '$lib/server/backups/backupSchema';
import { desc, eq } from 'drizzle-orm';
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
	backupTable,
	autoImportTable,
	notesTable,
	fileTable
} from '../postgres/schema';
import { splitArrayIntoChunks } from './helpers/misc/splitArrayIntoChunks';
import superjson from 'superjson';
import zlib from 'zlib';
import { backupFileHandler } from '$lib/server/files/fileHandler';
import { nanoid } from 'nanoid';
import { updatedTime } from './helpers/misc/updatedTime';
import { logging } from '$lib/server/logging';
import { serverEnv } from '$lib/server/serverEnv';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { dbExecuteLogger } from '../dbLogger';

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
		const firstBackup = await dbExecuteLogger(
			db.query.backupTable.findFirst({
				orderBy: ({ createdAt }, { asc }) => asc(createdAt)
			}),
			'Backup - Trim Backups - First Backup'
		);

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

		const lockedBackups = await dbExecuteLogger(
			db
				.select({ id: backupTable.id, createdAt: backupTable.createdAt })
				.from(backupTable)
				.where(eq(backupTable.locked, true)),
			'Backup - Trim Backups - Locked Backups'
		);

		const unlockedBackups = await dbExecuteLogger(
			db
				.select({ id: backupTable.id, createdAt: backupTable.createdAt })
				.from(backupTable)
				.where(eq(backupTable.locked, false)),
			'Backup - Trim Backups - Unlocked Backups'
		);

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
			await dbExecuteLogger(
				db
					.update(backupTable)
					.set({ locked: true })
					.where(inArrayWrapped(backupTable.id, backupsToLock)),
				'Backup - Trim Backups - Lock Backups'
			);
		}

		const retentionMonths = serverEnv.RETENTION_MONTHS;
		const retentionDate = new Date();
		retentionDate.setMonth(retentionDate.getMonth() - retentionMonths);

		const backupsToDelete = await dbExecuteLogger(
			db.query.backupTable.findMany({
				where: ({ createdAt, locked }, { lte, eq, and }) =>
					and(eq(locked, false), lte(createdAt, retentionDate))
			}),
			'Backup - Trim Backups - Backups To Delete'
		);

		const numberOfBackups = lockedBackups.length + unlockedBackups.length;

		//Make sure that you are never deleting more than 80% of the backups. If so then don't delete any.
		const percentageToDelete = backupsToDelete.length / numberOfBackups;
		const maxPercentageToDelete = 0.8;

		if (percentageToDelete > maxPercentageToDelete) {
			logging.info(
				`Retention Policy Not Met. Percentage To Delete: ${percentageToDelete}. Max Percentage To Delete: ${maxPercentageToDelete}`
			);
		} else if (backupsToDelete.length > 0) {
			db.transaction(async (trx) => {
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

			await dbExecuteLogger(
				db.insert(backupTable).values({
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
				}),
				'Backup - Import File - Insert Backup Table'
			);
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
			version: 10,
			data: {
				user: await dbExecuteLogger(db.select().from(user), 'Backup - Store Backup - User'),
				session: await dbExecuteLogger(
					db.select().from(session),
					'Backup - Store Backup - Session'
				),
				key: await dbExecuteLogger(db.select().from(key), 'Backup - Store Backup - Key'),
				account: await dbExecuteLogger(
					db.select().from(account),
					'Backup - Store Backup - Account'
				),
				bill: await dbExecuteLogger(db.select().from(bill), 'Backup - Store Backup - Bill'),
				budget: await dbExecuteLogger(db.select().from(budget), 'Backup - Store Backup - Budget'),
				category: await dbExecuteLogger(
					db.select().from(category),
					'Backup - Store Backup - Category'
				),
				tag: await dbExecuteLogger(db.select().from(tag), 'Backup - Store Backup - Tag'),
				label: await dbExecuteLogger(db.select().from(label), 'Backup - Store Backup - Label'),
				labelsToJournals: await dbExecuteLogger(
					db.select().from(labelsToJournals),
					'Backup - Store Backup - Labels To Journals'
				),
				transaction: await dbExecuteLogger(
					db.select().from(transaction),
					'Backup - Store Backup - Transaction'
				),
				journalEntry: await dbExecuteLogger(
					db.select().from(journalEntry),
					'Backup - Store Backup - Journal Entry'
				),
				importItemDetail: await dbExecuteLogger(
					db.select().from(importItemDetail),
					'Backup - Store Backup - Import Item Detail'
				),
				importTable: await dbExecuteLogger(
					db.select().from(importTable),
					'Backup - Store Backup - Import Table'
				),
				autoImportTable: await dbExecuteLogger(
					db.select().from(autoImportTable),
					'Backup - Store Backup - Auto Import Table'
				),
				importMapping: await dbExecuteLogger(
					db.select().from(importMapping),
					'Backup - Store Backup - Import Mapping'
				),
				reusableFilter: await dbExecuteLogger(
					db.select().from(reusableFilter),
					'Backup - Store Backup - Reusable Filter'
				),
				filter: await dbExecuteLogger(db.select().from(filter), 'Backup - Store Backup - Filter'),
				report: await dbExecuteLogger(db.select().from(report), 'Backup - Store Backup - Report'),
				filtersToReportConfigs: await dbExecuteLogger(
					db.select().from(filtersToReportConfigs),
					'Backup - Store Backup - Filters To Report Configs'
				),
				keyValueTable: await dbExecuteLogger(
					db.select().from(keyValueTable),
					'Backup - Store Backup - Key Value Table'
				),
				reportElement: await dbExecuteLogger(
					db.select().from(reportElement),
					'Backup - Store Backup - Report Element'
				),
				reportElementConfig: await dbExecuteLogger(
					db.select().from(reportElementConfig),
					'Backup - Store Backup - Report Element Config'
				),
				backup: (
					await dbExecuteLogger(db.select().from(backupTable), 'Backup - Store Backup - Backup')
				).map((item) => ({
					...item,
					information: superjson.stringify(item.information)
				})),
				note: await dbExecuteLogger(db.select().from(notesTable), 'Backup - Store Backup - Note'),
				file: await dbExecuteLogger(db.select().from(fileTable), 'Backup - Store Backup - File')
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
					numberAutoImport: backupDataDB.data.autoImportTable.length,
					numberImportMappings: backupDataDB.data.importMapping.length,
					numberReusableFilters: backupDataDB.data.reusableFilter.length,
					numberKeyValues: backupDataDB.data.keyValueTable.length,
					numberReports: backupDataDB.data.report.length,
					numberReportElements: backupDataDB.data.reportElement.length,
					numberReportFilters: backupDataDB.data.filter.length,
					numberReportItems: backupDataDB.data.reportElementConfig.length,
					numberBackups: backupDataDB.data.backup.length,
					numberNotes: backupDataDB.data.note.length,
					numberFiles: backupDataDB.data.file.length
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

		await dbExecuteLogger(
			db.insert(backupTable).values({
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
			}),
			'Backup - Store Backup - Insert Backup Table'
		);
	},
	getBackupData: async ({ returnRaw, id, db }: { id: string; returnRaw: boolean; db: DBType }) => {
		const backupFiles = await dbExecuteLogger(
			db.select().from(backupTable).where(eq(backupTable.id, id)),
			'Backup - Get Backup Data'
		);

		if (backupFiles.length === 0) {
			throw new Error('Backup File Not Found In DB');
		}

		const backupFile = backupFiles[0];

		const fileExists = await backupFileHandler.fileExists(backupFile.filename);

		if (!fileExists) {
			await dbExecuteLogger(
				db.update(backupTable).set({ fileExists: false }).where(eq(backupTable.id, id)),
				'Backup - Get Backup Data - Update File Exists (false)'
			);
			throw new Error('Backup File Not Found On Disk');
		}
		if (fileExists && backupFile.fileExists === false) {
			await dbExecuteLogger(
				db.update(backupTable).set({ fileExists: true }).where(eq(backupTable.id, id)),
				'Backup - Get Backup Data - Update File Exists (true)'
			);
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
		await dbExecuteLogger(
			db
				.update(backupTable)
				.set({ locked: true, ...updatedTime() })
				.where(eq(backupTable.id, id)),
			'Backup - Lock Backup'
		);
	},
	unlock: async ({ id, db }: { id: string; db: DBType }) => {
		await dbExecuteLogger(
			db
				.update(backupTable)
				.set({ locked: false, ...updatedTime() })
				.where(eq(backupTable.id, id)),
			'Backup - Unlock Backup'
		);
	},
	updateTitle: async ({ id, title, db }: { id: string; title: string; db: DBType }) => {
		await dbExecuteLogger(
			db
				.update(backupTable)
				.set({ title, ...updatedTime() })
				.where(eq(backupTable.id, id)),
			'Backup - Update Title'
		);
	},
	deleteBackup: async ({ id, db }: { id: string; db: DBType }) => {
		const backupFilesInDB = await dbExecuteLogger(
			db.select().from(backupTable).where(eq(backupTable.id, id)),
			'Backup - Delete Backup - Get Details'
		);

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
			await dbExecuteLogger(
				db.delete(backupTable).where(eq(backupTable.id, id)),
				'Backup - Delete - Delete'
			);
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
		const backups = await dbExecuteLogger(
			db.select().from(backupTable).where(eq(backupTable.id, id)),
			'Backup - Restore Backup - Get Backup'
		);
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
				await dbExecuteLogger(trx.delete(user), 'Backup Restore - Delete Users');
				await dbExecuteLogger(trx.delete(session), 'Backup Restore - Delete Sessions');
				await dbExecuteLogger(trx.delete(key), 'Backup Restore - Delete Keys');
			}
			await dbExecuteLogger(trx.delete(account), 'Backup Restore - Delete Accounts');
			await dbExecuteLogger(trx.delete(bill), 'Backup Restore - Delete Bills');
			await dbExecuteLogger(trx.delete(budget), 'Backup Restore - Delete Budgets');
			await dbExecuteLogger(trx.delete(category), 'Backup Restore - Delete Categories');
			await dbExecuteLogger(trx.delete(tag), 'Backup Restore - Delete Tags');
			await dbExecuteLogger(trx.delete(label), 'Backup Restore - Delete Labels');
			await dbExecuteLogger(trx.delete(transaction), 'Backup Restore - Delete Transactions');
			await dbExecuteLogger(trx.delete(journalEntry), 'Backup Restore - Delete Journal Entries');
			await dbExecuteLogger(
				trx.delete(labelsToJournals),
				'Backup Restore - Delete Labels To Journals'
			);
			await dbExecuteLogger(trx.delete(importMapping), 'Backup Restore - Delete Import Mapping');
			await dbExecuteLogger(trx.delete(importTable), 'Backup Restore - Delete Import Table');
			await dbExecuteLogger(
				trx.delete(importItemDetail),
				'Backup Restore - Delete Import Item Detail'
			);
			await dbExecuteLogger(trx.delete(reusableFilter), 'Backup Restore - Delete Reusable Filter');
			await dbExecuteLogger(trx.delete(filter), 'Backup Restore - Delete Filter');
			await dbExecuteLogger(trx.delete(report), 'Backup Restore - Delete Report');
			await dbExecuteLogger(
				trx.delete(filtersToReportConfigs),
				'Backup Restore - Delete Filters To Report Configs'
			);
			await dbExecuteLogger(trx.delete(keyValueTable), 'Backup Restore - Delete Key Value Table');
			await dbExecuteLogger(trx.delete(reportElement), 'Backup Restore - Delete Report Element');
			await dbExecuteLogger(
				trx.delete(reportElementConfig),
				'Backup Restore - Delete Report Element Config'
			);
			await dbExecuteLogger(trx.delete(backupTable), 'Backup Restore - Delete Backup Table');
			await dbExecuteLogger(
				trx.delete(autoImportTable),
				'Backup Restore - Delete Auto Import Table'
			);
			await dbExecuteLogger(trx.delete(notesTable), 'Backup Restore - Delete Notes Table');
			await dbExecuteLogger(trx.delete(fileTable), 'Backup Restore - Delete File Table');
			logging.info(`Deletions Complete: ${Date.now() - dataInsertionStart}ms`);

			//Update Database from Backup
			if (includeUsers) {
				await chunker(checkedBackupData.data.user, 1000, async (data) =>
					dbExecuteLogger(trx.insert(user).values(data), 'Backup Restore - Insert Users')
				);
				await chunker(checkedBackupData.data.session, 1000, async (data) =>
					dbExecuteLogger(trx.insert(session).values(data), 'Backup Restore - Insert Sessions')
				);
				await chunker(checkedBackupData.data.key, 1000, async (data) =>
					dbExecuteLogger(trx.insert(key).values(data), 'Backup Restore - Insert Keys')
				);
			}

			await chunker(checkedBackupData.data.account, 1000, async (data) =>
				dbExecuteLogger(trx.insert(account).values(data), 'Backup Restore - Insert Accounts')
			);
			logging.info(`Account Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.bill, 1000, async (data) =>
				dbExecuteLogger(trx.insert(bill).values(data), 'Backup Restore - Insert Bills')
			);
			logging.info(`Bill Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.budget, 1000, async (data) =>
				dbExecuteLogger(trx.insert(budget).values(data), 'Backup Restore - Insert Budgets')
			);
			logging.info(`Budget Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.category, 1000, async (data) =>
				dbExecuteLogger(trx.insert(category).values(data), 'Backup Restore - Insert Categories')
			);
			logging.info(`Category Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.tag, 1000, async (data) =>
				dbExecuteLogger(trx.insert(tag).values(data), 'Backup Restore - Insert Tags')
			);
			logging.info(`Tag Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.label, 1000, async (data) =>
				dbExecuteLogger(trx.insert(label).values(data), 'Backup Restore - Insert Labels')
			);
			logging.info(`Label Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.transaction, 1000, async (data) =>
				dbExecuteLogger(
					trx.insert(transaction).values(data),
					'Backup Restore - Insert Transactions'
				)
			);
			logging.info(`Transaction Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.journalEntry, 1000, async (data) =>
				dbExecuteLogger(
					trx.insert(journalEntry).values(data),
					'Backup Restore - Insert Journal Entries'
				)
			);
			logging.info(`Journal Entry Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.labelsToJournals, 1000, async (data) =>
				dbExecuteLogger(
					trx.insert(labelsToJournals).values(data),
					'Backup Restore - Insert Labels To Journals'
				)
			);
			logging.info(`Labels to Journals Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.importMapping, 1000, async (data) =>
				dbExecuteLogger(
					trx.insert(importMapping).values(data),
					'Backup Restore - Insert Import Mapping'
				)
			);
			logging.info(`Import Mapping Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.importTable, 1000, async (data) =>
				dbExecuteLogger(
					trx.insert(importTable).values(data),
					'Backup Restore - Insert Import Table'
				)
			);
			logging.info(`Import Table Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.importItemDetail, 1000, async (data) =>
				dbExecuteLogger(
					trx.insert(importItemDetail).values(data),
					'Backup Restore - Insert Import Item Detail'
				)
			);
			logging.info(`Import Item Detail Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.autoImportTable, 1000, async (data) =>
				dbExecuteLogger(
					trx.insert(autoImportTable).values(data),
					'Backup Restore - Insert Auto Import Table'
				)
			);
			logging.info(`Auto Import Insertions Complete: ${Date.now() - dataInsertionStart}ms`);
			await chunker(checkedBackupData.data.reusableFilter, 1000, async (data) =>
				dbExecuteLogger(
					trx.insert(reusableFilter).values(data),
					'Backup Restore - Insert Reusable Filter'
				)
			);
			logging.info(`Reusable Filter Insertions Complete: ${Date.now() - dataInsertionStart}ms`);

			await chunker(checkedBackupData.data.filter, 1000, async (data) =>
				dbExecuteLogger(trx.insert(filter).values(data), 'Backup Restore - Insert Filter')
			);
			logging.info(`Filter Insertions Complete: ${Date.now() - dataInsertionStart}ms`);

			await chunker(checkedBackupData.data.report, 1000, async (data) =>
				dbExecuteLogger(trx.insert(report).values(data), 'Backup Restore - Insert Report')
			);
			logging.info(`Report Insertions Complete: ${Date.now() - dataInsertionStart}ms`);

			await chunker(checkedBackupData.data.filtersToReportConfigs, 1000, async (data) =>
				dbExecuteLogger(
					trx.insert(filtersToReportConfigs).values(data),
					'Backup Restore - Insert Filters To Report Configs'
				)
			);
			logging.info(
				`Filters To Report Configs Insertions Complete: ${Date.now() - dataInsertionStart}ms`
			);

			await chunker(checkedBackupData.data.reportElement, 1000, async (data) =>
				dbExecuteLogger(
					trx.insert(reportElement).values(data),
					'Backup Restore - Insert Report Element'
				)
			);
			logging.info(`Report Element Insertions Complete: ${Date.now() - dataInsertionStart}ms`);

			await chunker(checkedBackupData.data.reportElementConfig, 1000, async (data) =>
				dbExecuteLogger(
					trx.insert(reportElementConfig).values(data),
					'Backup Restore - Insert Report Element Config'
				)
			);
			logging.info(
				`Report Element Config Insertions Complete: ${Date.now() - dataInsertionStart}ms`
			);

			await chunker(checkedBackupData.data.keyValueTable, 1000, async (data) =>
				dbExecuteLogger(
					trx.insert(keyValueTable).values(data),
					'Backup Restore - Insert Key Value Table'
				)
			);
			logging.info(`Key Value Table Insertions Complete: ${Date.now() - dataInsertionStart}ms`);

			await chunker(checkedBackupData.data.backup, 1000, async (data) =>
				dbExecuteLogger(
					trx.insert(backupTable).values(
						data.map((item) => ({
							...item,
							information: combinedBackupInfoSchema.parse(superjson.parse(item.information))
						}))
					),
					'Backup Restore - Insert Backup Table'
				)
			);
			logging.info(`Backup Table Insertions Complete: ${Date.now() - dataInsertionStart}ms`);

			await chunker(checkedBackupData.data.note, 1000, async (data) =>
				dbExecuteLogger(trx.insert(notesTable).values(data), 'Backup Restore - Insert Notes Table')
			);
			logging.info(`Notes Insertions Complete: ${Date.now() - dataInsertionStart}ms`);

			await chunker(checkedBackupData.data.file, 1000, async (data) =>
				dbExecuteLogger(trx.insert(fileTable).values(data), 'Backup Restore - Insert File Table')
			);
			logging.info(`Notes Insertions Complete: ${Date.now() - dataInsertionStart}ms`);

			//Mark the backup as having a restored date.
			await dbExecuteLogger(
				trx
					.update(backupTable)
					.set({ restoreDate: new Date(), ...updatedTime() })
					.where(eq(backupTable.id, id)),
				'Backup Restore - Update Backup Table'
			);
		});
	},
	refreshList: async ({ db }: { db: DBType }) => {
		const [backupsInDB, backupFiles] = await Promise.all([
			dbExecuteLogger(db.select().from(backupTable), 'Backup - Refresh List - Get Backups In DB'),
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
				dbExecuteLogger(
					db
						.update(backupTable)
						.set({ fileExists: false })
						.where(eq(backupTable.filename, filename)),
					'Backup - Refresh List - Mark File Not Exists'
				)
			)
		);

		//Mark Files in DB BUt Not Exists that do exist as file exists
		await Promise.all(
			filesNotExistInDBButExistInFiles.map((filename) =>
				dbExecuteLogger(
					db
						.update(backupTable)
						.set({ fileExists: true })
						.where(eq(backupTable.filename, filename)),
					'Backup - Refresh List - Mark File Exists'
				)
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

			await dbExecuteLogger(
				db.insert(backupTable).values({
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
				}),
				'Backup - Refresh List - Insert Backup Table'
			);
			const end = new Date();
			logging.info(
				`File ${index + 1} of ${filesNotInDB.length} took ${end.getTime() - start.getTime()}ms`
			);
		}
	},
	list: async ({ db }: { db: DBType }) => {
		const listData = await dbExecuteLogger(
			db.select().from(backupTable).orderBy(desc(backupTable.createdAt)),
			'Backup - List'
		);

		return listData.map((data) => ({
			...data,
			information: backupSchemaInfoToLatest(data.information)
		}));
	},
	getBackupInfo: async ({ db, id }: { db: DBType; id: string }) => {
		const data = await dbExecuteLogger(
			db.select().from(backupTable).where(eq(backupTable.id, id)),
			'Backup - Get Info'
		);
		if (data.length === 0) {
			return undefined;
		}

		return { ...data[0], information: backupSchemaInfoToLatest(data[0].information) };
	},
	getBackupInfoByFilename: async ({ db, filename }: { db: DBType; filename: string }) => {
		const data = await dbExecuteLogger(
			db.select().from(backupTable).where(eq(backupTable.filename, filename)),
			'Backup - Get Info By Filename'
		);
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
