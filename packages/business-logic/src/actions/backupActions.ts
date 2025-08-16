import {
	backupSchemaToLatest,
	backupSchemaInfoToLatest,
	combinedBackupSchema,
	currentBackupSchema,
	type CurrentBackupSchemaType,
	type CombinedBackupSchemaType,
	combinedBackupInfoSchema,
	type CurrentBackupSchemaInfoType
} from '@totallator/database';
import { desc, eq } from 'drizzle-orm';
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
	fileTable,
	type BackupTableType,
	associatedInfoTable
} from '@totallator/database';
import { splitArrayIntoChunks } from './helpers/misc/splitArrayIntoChunks';
import superjson from 'superjson';
import zlib from 'zlib';
import { backupFileHandler } from '../server/files/fileHandler';
import { nanoid } from 'nanoid';
import { updatedTime } from './helpers/misc/updatedTime';
import { getLogger } from '@/logger';
import { getServerEnv } from '@/serverEnv';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import { materializedViewActions } from './materializedViewActions';
import { getContextDB, runInTransactionWithLogging } from '@totallator/context';
import { emitEvent } from '../events/eventHelper.js';
import { fixedDelay } from '@/helpers/fixedDelay';

type RobustQueryOptions = {
	timeout?: number;
	maxRetries?: number;
	retryDelay?: number;
};

const executeQueryWithRetry = async <T>(
	queryFn: () => Promise<T>,
	description: string,
	options: RobustQueryOptions = {}
): Promise<T> => {
	const { timeout = 1000, maxRetries = 10, retryDelay = 100 } = options;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			// Create a timeout promise
			const timeoutPromise = new Promise<never>((_, reject) => {
				setTimeout(
					() => reject(new Error(`Query timeout after ${timeout}ms: ${description}`)),
					timeout
				);
			});

			// Race between the query and timeout
			const result = await Promise.race([queryFn(), timeoutPromise]);

			getLogger('backup').info(`Query succeeded on attempt ${attempt}: ${description}`);
			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			getLogger('backup').pino.warn(
				`Query attempt ${attempt} failed for ${description}: ${errorMessage}`
			);

			if (attempt === maxRetries) {
				getLogger('backup').pino.error(
					`All ${maxRetries} attempts failed for ${description}. Final error: ${errorMessage}`
				);
				throw new Error(
					`Query failed after ${maxRetries} attempts: ${description}. Last error: ${errorMessage}`
				);
			}

			// Wait before retry
			await fixedDelay(retryDelay);
		}
	}

	throw new Error(`Unexpected error in executeQueryWithRetry for ${description}`);
};

async function writeToMsgPackFile(data: unknown, fileName: string) {
	const compressedConvertedData = zlib.gzipSync(superjson.stringify(data));
	await backupFileHandler().write(fileName, compressedConvertedData);
}

async function readFromMsgPackFile(filename: string) {
	const fileData = await backupFileHandler().readToBuffer(filename);
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
	trimBackups: async (): Promise<void> => {
		const db = getContextDB();
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

		const retentionMonths = getServerEnv().RETENTION_MONTHS;
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
			getLogger('backup').pino.info(
				`Retention Policy Not Met. Percentage To Delete: ${percentageToDelete}. Max Percentage To Delete: ${maxPercentageToDelete}`
			);
		} else if (backupsToDelete.length > 0) {
			await Promise.all(
				backupsToDelete.map(async (backup) => {
					await backupActions.deleteBackup({ id: backup.id });
				})
			);

			getLogger('backup').pino.info(`Deleted ${backupsToDelete.length} backups`);
		}
	},
	importFile: async ({
		backupFile,
		id
	}: {
		backupFile: File;
		id: string;
	}): Promise<string | undefined> => {
		const db = getContextDB();
		const getFilenameInfo = (filename: string) => {
			const extension = filename.split('.').pop();
			const withoutExtension = extension
				? filename.substring(0, filename.length - extension.length - 1)
				: filename;

			return { extension, withoutExtension, filename };
		};

		//Store backup file into target folder, making sure to rename backup file if there is an existing file with the same name
		let backupFileName = backupFile.name;
		const backupFileExists = await backupFileHandler().fileExists(backupFileName);

		if (backupFileExists) {
			const fileInfo = getFilenameInfo(backupFileName);
			backupFileName = `${fileInfo.withoutExtension}-ImportDuplicate-${new Date().toISOString()}.${fileInfo.extension}`;
		}

		await backupFileHandler().write(backupFileName, Buffer.from(await backupFile.arrayBuffer()));

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
			getLogger('backup').pino.error(
				`Backup Import Failed. Incorrect Contents - ${backupFileName}`
			);
			getLogger('backup').pino.error(e);
			await backupFileHandler().deleteFile(backupFileName);
			return;
		}

		return id;
	},
	storeBackup: async ({
		title = 'Backup',
		compress = true,
		creationReason,
		createdBy,
		locked = false,
		onStatus = () => {}
	}: {
		title?: string;
		compress?: boolean;
		creationReason: string;
		createdBy: string;
		locked?: boolean;
		onStatus?: (status: string) => void;
	}): Promise<void> => {
		const db = getContextDB();
		const date = new Date();
		const filenameUse = `${date.toISOString()}-${title}.${compress ? 'data' : 'json'}`;

		onStatus('Starting Storage Of Backup');
		console.log('=== BACKUP CREATION STARTED ===');
		getLogger('backup').pino.info(`Starting backup creation: ${title}`);

		// Define the tables to backup and their display names
		const tablesToBackup = [
			{ table: user, name: 'Users', key: 'user' },
			{ table: session, name: 'Sessions', key: 'session' },
			{ table: key, name: 'Keys', key: 'key' },
			{ table: account, name: 'Accounts', key: 'account' },
			{ table: bill, name: 'Bills', key: 'bill' },
			{ table: budget, name: 'Budgets', key: 'budget' },
			{ table: category, name: 'Categories', key: 'category' },
			{ table: tag, name: 'Tags', key: 'tag' },
			{ table: label, name: 'Labels', key: 'label' },
			{ table: labelsToJournals, name: 'Labels to Journals', key: 'labelsToJournals' },
			{ table: transaction, name: 'Transactions', key: 'transaction' },
			{ table: journalEntry, name: 'Journal Entries', key: 'journalEntry' },
			{ table: importItemDetail, name: 'Import Item Details', key: 'importItemDetail' },
			{ table: importTable, name: 'Import Table', key: 'importTable' },
			{ table: autoImportTable, name: 'Auto Import Table', key: 'autoImportTable' },
			{ table: importMapping, name: 'Import Mappings', key: 'importMapping' },
			{ table: reusableFilter, name: 'Reusable Filters', key: 'reusableFilter' },
			{ table: filter, name: 'Filters', key: 'filter' },
			{ table: report, name: 'Reports', key: 'report' },
			{
				table: filtersToReportConfigs,
				name: 'Filters to Report Configs',
				key: 'filtersToReportConfigs'
			},
			{ table: keyValueTable, name: 'Key Value Table', key: 'keyValueTable' },
			{ table: reportElement, name: 'Report Elements', key: 'reportElement' },
			{ table: reportElementConfig, name: 'Report Element Configs', key: 'reportElementConfig' },
			{ table: backupTable, name: 'Backup Table', key: 'backup', special: true },
			{ table: notesTable, name: 'Notes', key: 'note' },
			{ table: fileTable, name: 'Files', key: 'file' },
			{ table: associatedInfoTable, name: 'Associated Info', key: 'associatedInfo' }
		];

		const totalTables = tablesToBackup.length;
		const tableData: any = {};

		// Process each table sequentially with progress reporting
		for (let i = 0; i < tablesToBackup.length; i++) {
			const tableInfo = tablesToBackup[i];
			const progress = i + 1;

			onStatus(`Backing up ${tableInfo.name} (${progress}/${totalTables})`);
			console.log(`Backing up ${tableInfo.name} (${progress}/${totalTables})...`);

			const startTime = Date.now();

			if (tableInfo.special && tableInfo.key === 'backup') {
				// Special handling for backup table with retry mechanism
				const rawData = await executeQueryWithRetry(
					() =>
						dbExecuteLogger(
							db.select().from(tableInfo.table),
							`Backup - Store Backup - ${tableInfo.name}`
						),
					`Special backup table query - ${tableInfo.name}`,
					{ timeout: 1000, maxRetries: 10, retryDelay: 100 }
				);
				tableData[tableInfo.key] = rawData.map((item) => ({
					...item,
					information: superjson.stringify(item.information)
				}));
			} else {
				// Standard table handling with retry mechanism
				tableData[tableInfo.key] = await executeQueryWithRetry(
					() =>
						dbExecuteLogger(
							db.select().from(tableInfo.table),
							`Backup - Store Backup - ${tableInfo.name}`
						),
					`Standard table query - ${tableInfo.name}`,
					{ timeout: 1000, maxRetries: 10, retryDelay: 100 }
				);
			}

			const duration = Date.now() - startTime;
			const recordCount = tableData[tableInfo.key].length;
			console.log(`✓ ${tableInfo.name}: ${recordCount} records (${duration}ms)`);
			getLogger('backup').pino.info(
				`Retrieved for backup ${tableInfo.name}: ${recordCount} records in ${duration}ms`
			);

			await fixedDelay(100);
		}

		const backupDataDB: Omit<CurrentBackupSchemaType, 'information'> = {
			version: 11,
			data: tableData
		};

		onStatus('Data For Backup Retrieved From DB');
		console.log('All table data retrieved successfully');

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
					numberFiles: backupDataDB.data.file.length,
					numberAssociatedInfo: backupDataDB.data.associatedInfo.length
				}
			}
		};

		onStatus('Backup Ready For Parsing');
		console.log('Validating backup data structure...');

		const checkedBackupData = currentBackupSchema.parse(backupData);

		onStatus('Backup Parsed. Ready for storage.');
		console.log('Backup data validated successfully');

		const writeStart = Date.now();
		if (compress) {
			console.log('Writing compressed backup file...');
			await writeToMsgPackFile(checkedBackupData, filenameUse);
		} else {
			console.log('Writing JSON backup file...');
			await backupFileHandler().write(filenameUse, superjson.stringify(checkedBackupData));
		}
		const writeDuration = Date.now() - writeStart;

		onStatus('Backup Stored');
		console.log(`Backup file written successfully (${writeDuration}ms)`);

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

		console.log('=== BACKUP CREATION COMPLETED ===');
		console.log(`Backup File: ${filenameUse}`);
		getLogger('backup').pino.info(`Backup creation completed: ${filenameUse}`);
		onStatus('Backup Creation Complete');
	},
	getBackupData: async ({ returnRaw, id }: { id: string; returnRaw: boolean }) => {
		const db = getContextDB();
		const backupFiles = await dbExecuteLogger(
			db.select().from(backupTable).where(eq(backupTable.id, id)),
			'Backup - Get Backup Data'
		);

		if (backupFiles.length === 0) {
			throw new Error('Backup File Not Found In DB');
		}

		const backupFile = backupFiles[0];

		const fileExists = await backupFileHandler().fileExists(backupFile.filename);

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
			return await backupFileHandler().readToBuffer(backupFile.filename);
		}

		const isCompressed = backupFile.compressed;

		const loadedBackupData = isCompressed
			? await readFromMsgPackFile(backupFile.filename)
			: superjson.parse((await backupFileHandler().readToString(backupFile.filename)).toString());

		return loadedBackupData;
	},
	getBackupDataStrutured: async ({ id }: { id: string }): Promise<CurrentBackupSchemaType> => {
		const backupData = await backupActions.getBackupData({ id, returnRaw: false });

		const backupDataParsed = combinedBackupSchema.parse(backupData);

		return backupSchemaToLatest(backupDataParsed);
	},
	lock: async ({ id }: { id: string }): Promise<void> => {
		const db = getContextDB();
		await dbExecuteLogger(
			db
				.update(backupTable)
				.set({ locked: true, ...updatedTime() })
				.where(eq(backupTable.id, id)),
			'Backup - Lock Backup'
		);
	},
	unlock: async ({ id }: { id: string }): Promise<void> => {
		const db = getContextDB();
		await dbExecuteLogger(
			db
				.update(backupTable)
				.set({ locked: false, ...updatedTime() })
				.where(eq(backupTable.id, id)),
			'Backup - Unlock Backup'
		);
	},
	updateTitle: async ({ id, title }: { id: string; title: string }): Promise<void> => {
		const db = getContextDB();
		await dbExecuteLogger(
			db
				.update(backupTable)
				.set({ title, ...updatedTime() })
				.where(eq(backupTable.id, id)),
			'Backup - Update Title'
		);
	},
	deleteBackup: async ({ id }: { id: string }): Promise<void> => {
		const db = getContextDB();
		const backupFilesInDB = await dbExecuteLogger(
			db.select().from(backupTable).where(eq(backupTable.id, id)),
			'Backup - Delete Backup - Get Details'
		);

		const backupFileInDB = backupFilesInDB[0];

		const backupExists = await backupFileHandler().fileExists(backupFileInDB.filename);

		if (backupFileInDB && backupFileInDB.locked) {
			getLogger('backup').pino.info(
				`Cannot Delete Backup as it is locked - ${backupFileInDB.filename}`
			);
			return;
		}

		if (backupExists) {
			await backupFileHandler().deleteFile(backupFileInDB.filename);
		}

		if (backupFilesInDB.length === 1) {
			await dbExecuteLogger(
				db.delete(backupTable).where(eq(backupTable.id, id)),
				'Backup - Delete - Delete'
			);
		}

		return;
	},
	restoreTrigger: async ({
		id,
		includeUsers = false,
		userId
	}: {
		id: string;
		includeUsers?: boolean;
		userId?: string;
	}): Promise<void> => {
		const db = getContextDB();

		// Perform cursory checks to ensure backup exists and is valid
		const backups = await dbExecuteLogger(
			db.select().from(backupTable).where(eq(backupTable.id, id)),
			'Backup - Restore Trigger - Get Backup'
		);

		if (backups.length === 0) {
			throw new Error('Backup Not Found');
		}

		const backup = backups[0];

		// Check if backup file exists on disk
		const fileExists = await backupFileHandler().fileExists(backup.filename);
		if (!fileExists) {
			throw new Error('Backup File Not Found On Disk');
		}

		// Emit the trigger event - this will start the background restoration
		emitEvent('backup.restore.triggered', { backupId: id, includeUsers, userId });

		await fixedDelay(100);

		getLogger('backup').pino.info(`Backup restore triggered for backup: ${backup.filename}`);
	},
	restoreBackup: async ({
		id,
		includeUsers = false,
		userId
	}: {
		id: string;
		includeUsers?: boolean;
		userId?: string;
	}): Promise<void> => {
		const startTime = Date.now();

		// Helper function to emit progress events (escapes transaction)
		const emitProgress = (
			phase: 'retrieving' | 'pre-backup' | 'deleting' | 'restoring',
			current: number,
			total: number,
			message?: string
		) => {
			// Use setTimeout to escape the transaction context
			setTimeout(() => {
				emitEvent('backup.restore.progress', {
					backupId: id,
					phase,
					current,
					total,
					message,
					userId
				});
			}, 0);
		};

		console.log('=== BACKUP RESTORE STARTED ===');
		console.log(`Backup ID: ${id}`);
		console.log(`Include Users: ${includeUsers}`);
		getLogger('backup').pino.info(`Starting backup restore process for backup: ${id}`);
		// Emit start event
		emitEvent('backup.restore.started', { backupId: id, includeUsers, userId });

		try {
			// Step 1: Retrieve backup information
			emitProgress('retrieving', 1, 6, 'Retrieving backup information');
			const db = getContextDB();
			const backups = await dbExecuteLogger(
				db.select().from(backupTable).where(eq(backupTable.id, id)),
				'Backup - Restore Backup - Get Backup'
			);
			if (backups.length === 0) {
				throw new Error('Backup Not Found');
			}
			const backup = backups[0];

			// Step 2: Load and validate backup data
			emitProgress('retrieving', 2, 6, 'Loading backup data from storage');
			const checkedBackupData = await backupActions.getBackupDataStrutured({ id });

			// Step 3: Create pre-restore backup
			emitProgress('pre-backup', 3, 6, 'Creating pre-restore backup');
			getLogger('backup').pino.info('Starting pre-restore backup creation...');
			console.log('Creating pre-restore backup before restoration begins...');
			const preBackupStart = Date.now();
			//Produce a new backup prior to any restore.
			await backupActions.storeBackup({
				title: `Pre-Restore - ${backup.createdAt.toISOString().substring(0, 10)} - ${backup.title}`,
				compress: true,
				createdBy: 'System',
				creationReason: 'Pre-Restore',
				onStatus: (newStatus) => {
					emitProgress('pre-backup', 3, 6, newStatus);
				}
			});
			const preBackupDuration = Date.now() - preBackupStart;
			getLogger('backup').pino.info(`Pre-restore backup completed in ${preBackupDuration}ms`);
			console.log(`Pre-restore backup created successfully (${preBackupDuration}ms)`);

			// Step 4: Calculate operation counts for progress tracking
			emitProgress('pre-backup', 4, 6, 'Calculating restoration plan');
			const deleteOperations = includeUsers ? 24 : 21; // Number of delete operations
			const insertOperations = Object.keys(checkedBackupData.data).length; // Number of data types to insert
			let currentDeleteStep = 0;
			let currentInsertStep = 0;

			// Step 5: Prepare for database operations
			emitProgress('pre-backup', 5, 6, 'Preparing database operations');

			// Step 6: Start database transaction
			emitProgress('pre-backup', 6, 6, 'Starting database restoration transaction');

			const dataInsertionStart = Date.now();
			console.log('Starting database transaction for restore...');
			getLogger('backup').pino.info('Beginning database restoration transaction');
			await runInTransactionWithLogging('Restore Backup', async () => {
				const db = getContextDB();
				//Clear The Database
				console.log('Phase 1: Clearing existing database data...');
				emitProgress('deleting', 0, deleteOperations, 'Starting database cleanup');

				if (includeUsers) {
					await dbExecuteLogger(db.delete(user), 'Backup Restore - Delete Users');
					emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted users');
					await dbExecuteLogger(db.delete(session), 'Backup Restore - Delete Sessions');
					emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted sessions');
					await dbExecuteLogger(db.delete(key), 'Backup Restore - Delete Keys');
					emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted keys');
				}

				await dbExecuteLogger(db.delete(account), 'Backup Restore - Delete Accounts');
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted accounts');
				await dbExecuteLogger(db.delete(bill), 'Backup Restore - Delete Bills');
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted bills');
				await dbExecuteLogger(db.delete(budget), 'Backup Restore - Delete Budgets');
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted budgets');
				await dbExecuteLogger(db.delete(category), 'Backup Restore - Delete Categories');
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted categories');
				await dbExecuteLogger(db.delete(tag), 'Backup Restore - Delete Tags');
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted tags');
				await dbExecuteLogger(db.delete(label), 'Backup Restore - Delete Labels');
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted labels');
				await dbExecuteLogger(db.delete(transaction), 'Backup Restore - Delete Transactions');
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted transactions');
				await dbExecuteLogger(db.delete(journalEntry), 'Backup Restore - Delete Journal Entries');
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted journal entries');
				await dbExecuteLogger(
					db.delete(labelsToJournals),
					'Backup Restore - Delete Labels To Journals'
				);
				emitProgress(
					'deleting',
					++currentDeleteStep,
					deleteOperations,
					'Deleted labels to journals'
				);
				await dbExecuteLogger(db.delete(importMapping), 'Backup Restore - Delete Import Mapping');
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted import mappings');
				await dbExecuteLogger(db.delete(importTable), 'Backup Restore - Delete Import Table');
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted import table');
				await dbExecuteLogger(
					db.delete(importItemDetail),
					'Backup Restore - Delete Import Item Detail'
				);
				emitProgress(
					'deleting',
					++currentDeleteStep,
					deleteOperations,
					'Deleted import item details'
				);
				await dbExecuteLogger(db.delete(reusableFilter), 'Backup Restore - Delete Reusable Filter');
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted reusable filters');
				await dbExecuteLogger(db.delete(filter), 'Backup Restore - Delete Filter');
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted filters');
				await dbExecuteLogger(db.delete(report), 'Backup Restore - Delete Report');
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted reports');
				await dbExecuteLogger(
					db.delete(filtersToReportConfigs),
					'Backup Restore - Delete Filters To Report Configs'
				);
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted report configs');
				await dbExecuteLogger(db.delete(reportElement), 'Backup Restore - Delete Report Element');
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted report elements');
				await dbExecuteLogger(
					db.delete(reportElementConfig),
					'Backup Restore - Delete Report Element Config'
				);
				emitProgress(
					'deleting',
					++currentDeleteStep,
					deleteOperations,
					'Deleted report element configs'
				);
				await dbExecuteLogger(db.delete(backupTable), 'Backup Restore - Delete Backup Table');
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted backup table');
				await dbExecuteLogger(
					db.delete(autoImportTable),
					'Backup Restore - Delete Auto Import Table'
				);
				emitProgress(
					'deleting',
					++currentDeleteStep,
					deleteOperations,
					'Deleted auto import table'
				);
				await dbExecuteLogger(db.delete(notesTable), 'Backup Restore - Delete Notes Table');
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted notes table');
				await dbExecuteLogger(db.delete(fileTable), 'Backup Restore - Delete File Table');
				emitProgress('deleting', ++currentDeleteStep, deleteOperations, 'Deleted file table');
				await dbExecuteLogger(
					db.delete(associatedInfoTable),
					'Backup Restore - Delete Associated Info Table'
				);
				emitProgress(
					'deleting',
					++currentDeleteStep,
					deleteOperations,
					'Deleted associated info table'
				);
				const deletionDuration = Date.now() - dataInsertionStart;
				getLogger('backup').pino.info(`Deletions Complete: ${deletionDuration}ms`);
				console.log(`Phase 1 Complete: Database cleanup finished (${deletionDuration}ms)`);

				//Update Database from Backup
				console.log('Phase 2: Restoring data from backup...');
				emitProgress('restoring', 0, insertOperations, 'Starting data restoration');

				if (includeUsers) {
					await chunker(checkedBackupData.data.user, 1000, async (data) =>
						dbExecuteLogger(db.insert(user).values(data), 'Backup Restore - Insert Users')
					);
					emitProgress('restoring', ++currentInsertStep, insertOperations, 'Restored users');
					await chunker(checkedBackupData.data.session, 1000, async (data) =>
						dbExecuteLogger(db.insert(session).values(data), 'Backup Restore - Insert Sessions')
					);
					emitProgress('restoring', ++currentInsertStep, insertOperations, 'Restored sessions');
					await chunker(checkedBackupData.data.key, 1000, async (data) =>
						dbExecuteLogger(db.insert(key).values(data), 'Backup Restore - Insert Keys')
					);
					emitProgress('restoring', ++currentInsertStep, insertOperations, 'Restored keys');
				}

				console.log(`Restoring ${checkedBackupData.data.account.length} accounts...`);
				await chunker(checkedBackupData.data.account, 1000, async (data) =>
					dbExecuteLogger(db.insert(account).values(data), 'Backup Restore - Insert Accounts')
				);
				emitProgress('restoring', ++currentInsertStep, insertOperations, 'Restored accounts');
				const accountDuration = Date.now() - dataInsertionStart;
				getLogger('backup').pino.info(`Account Insertions Complete: ${accountDuration}ms`);
				console.log(
					`✓ Accounts restored (${checkedBackupData.data.account.length} records, ${accountDuration}ms)`
				);

				await chunker(checkedBackupData.data.bill, 1000, async (data) =>
					dbExecuteLogger(db.insert(bill).values(data), 'Backup Restore - Insert Bills')
				);
				emitProgress('restoring', ++currentInsertStep, insertOperations, 'Restored bills');
				getLogger('backup').pino.info(
					`Bill Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.budget, 1000, async (data) =>
					dbExecuteLogger(db.insert(budget).values(data), 'Backup Restore - Insert Budgets')
				);
				emitProgress('restoring', ++currentInsertStep, insertOperations, 'Restored budgets');
				getLogger('backup').pino.info(
					`Budget Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.category, 1000, async (data) =>
					dbExecuteLogger(db.insert(category).values(data), 'Backup Restore - Insert Categories')
				);
				emitProgress('restoring', ++currentInsertStep, insertOperations, 'Restored categories');
				getLogger('backup').pino.info(
					`Category Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.tag, 1000, async (data) =>
					dbExecuteLogger(db.insert(tag).values(data), 'Backup Restore - Insert Tags')
				);
				emitProgress('restoring', ++currentInsertStep, insertOperations, 'Restored tags');
				getLogger('backup').pino.info(
					`Tag Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.label, 1000, async (data) =>
					dbExecuteLogger(db.insert(label).values(data), 'Backup Restore - Insert Labels')
				);
				emitProgress('restoring', ++currentInsertStep, insertOperations, 'Restored labels');
				getLogger('backup').pino.info(
					`Label Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				console.log(`Restoring ${checkedBackupData.data.transaction.length} transactions...`);
				await chunker(checkedBackupData.data.transaction, 1000, async (data) =>
					dbExecuteLogger(
						db.insert(transaction).values(data),
						'Backup Restore - Insert Transactions'
					)
				);
				emitProgress('restoring', ++currentInsertStep, insertOperations, 'Restored transactions');
				const transactionDuration = Date.now() - dataInsertionStart;
				getLogger('backup').pino.info(`Transaction Insertions Complete: ${transactionDuration}ms`);
				console.log(
					`✓ Transactions restored (${checkedBackupData.data.transaction.length} records, ${transactionDuration}ms)`
				);

				console.log(`Restoring ${checkedBackupData.data.journalEntry.length} journal entries...`);
				await chunker(checkedBackupData.data.journalEntry, 1000, async (data) =>
					dbExecuteLogger(
						db.insert(journalEntry).values(data),
						'Backup Restore - Insert Journal Entries'
					)
				);
				emitProgress(
					'restoring',
					++currentInsertStep,
					insertOperations,
					'Restored journal entries'
				);
				const journalDuration = Date.now() - dataInsertionStart;
				getLogger('backup').pino.info(`Journal Entry Insertions Complete: ${journalDuration}ms`);
				console.log(
					`✓ Journal entries restored (${checkedBackupData.data.journalEntry.length} records, ${journalDuration}ms)`
				);

				await chunker(checkedBackupData.data.labelsToJournals, 1000, async (data) =>
					dbExecuteLogger(
						db.insert(labelsToJournals).values(data),
						'Backup Restore - Insert Labels To Journals'
					)
				);
				emitProgress(
					'restoring',
					++currentInsertStep,
					insertOperations,
					'Restored labels to journals'
				);
				getLogger('backup').pino.info(
					`Labels to Journals Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.importMapping, 1000, async (data) =>
					dbExecuteLogger(
						db.insert(importMapping).values(data),
						'Backup Restore - Insert Import Mapping'
					)
				);
				emitProgress(
					'restoring',
					++currentInsertStep,
					insertOperations,
					'Restored import mappings'
				);
				getLogger('backup').pino.info(
					`Import Mapping Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.importTable, 1000, async (data) =>
					dbExecuteLogger(
						db.insert(importTable).values(data),
						'Backup Restore - Insert Import Table'
					)
				);
				emitProgress('restoring', ++currentInsertStep, insertOperations, 'Restored import table');
				getLogger('backup').pino.info(
					`Import Table Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.importItemDetail, 1000, async (data) =>
					dbExecuteLogger(
						db.insert(importItemDetail).values(data),
						'Backup Restore - Insert Import Item Detail'
					)
				);
				emitProgress(
					'restoring',
					++currentInsertStep,
					insertOperations,
					'Restored import item details'
				);
				getLogger('backup').pino.info(
					`Import Item Detail Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.autoImportTable, 1000, async (data) =>
					dbExecuteLogger(
						db.insert(autoImportTable).values(data),
						'Backup Restore - Insert Auto Import Table'
					)
				);
				emitProgress(
					'restoring',
					++currentInsertStep,
					insertOperations,
					'Restored auto import table'
				);
				getLogger('backup').pino.info(
					`Auto Import Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.reusableFilter, 1000, async (data) =>
					dbExecuteLogger(
						db.insert(reusableFilter).values(data),
						'Backup Restore - Insert Reusable Filter'
					)
				);
				emitProgress(
					'restoring',
					++currentInsertStep,
					insertOperations,
					'Restored reusable filters'
				);
				getLogger('backup').pino.info(
					`Reusable Filter Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.filter, 1000, async (data) =>
					dbExecuteLogger(db.insert(filter).values(data), 'Backup Restore - Insert Filter')
				);
				emitProgress('restoring', ++currentInsertStep, insertOperations, 'Restored filters');
				getLogger('backup').pino.info(
					`Filter Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.report, 1000, async (data) =>
					dbExecuteLogger(db.insert(report).values(data), 'Backup Restore - Insert Report')
				);
				emitProgress('restoring', ++currentInsertStep, insertOperations, 'Restored reports');
				getLogger('backup').pino.info(
					`Report Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.filtersToReportConfigs, 1000, async (data) =>
					dbExecuteLogger(
						db.insert(filtersToReportConfigs).values(data),
						'Backup Restore - Insert Filters To Report Configs'
					)
				);
				emitProgress('restoring', ++currentInsertStep, insertOperations, 'Restored report configs');
				getLogger('backup').pino.info(
					`Filters To Report Configs Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.reportElement, 1000, async (data) =>
					dbExecuteLogger(
						db.insert(reportElement).values(data),
						'Backup Restore - Insert Report Element'
					)
				);
				emitProgress(
					'restoring',
					++currentInsertStep,
					insertOperations,
					'Restored report elements'
				);
				getLogger('backup').pino.info(
					`Report Element Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.reportElementConfig, 1000, async (data) =>
					dbExecuteLogger(
						db.insert(reportElementConfig).values(data),
						'Backup Restore - Insert Report Element Config'
					)
				);
				emitProgress(
					'restoring',
					++currentInsertStep,
					insertOperations,
					'Restored report element configs'
				);
				getLogger('backup').pino.info(
					`Report Element Config Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.backup, 1000, async (data) => {
					dbExecuteLogger(
						db.insert(backupTable).values(
							data.map((item) => {
								const parsedInformation = superjson.parse(item.information);

								//@ts-expect-error I know the data strcuture, and this is correct
								if (parsedInformation?.information?.createdAt) {
									//@ts-expect-error I know the data strcuture, and this is correct
									parsedInformation.information.createdAt = new Date(
										//@ts-expect-error I know the data strcuture, and this is correct
										parsedInformation.information.createdAt
									);
								}
								return {
									...item,
									information: combinedBackupInfoSchema.parse(parsedInformation)
								};
							})
						),
						'Backup Restore - Insert Backup Table'
					);
				});
				emitProgress('restoring', ++currentInsertStep, insertOperations, 'Restored backup table');
				getLogger('backup').pino.info(
					`Backup Table Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.note, 1000, async (data) =>
					dbExecuteLogger(db.insert(notesTable).values(data), 'Backup Restore - Insert Notes Table')
				);
				emitProgress('restoring', ++currentInsertStep, insertOperations, 'Restored notes');
				getLogger('backup').pino.info(
					`Notes Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.file, 1000, async (data) =>
					dbExecuteLogger(db.insert(fileTable).values(data), 'Backup Restore - Insert File Table')
				);
				emitProgress('restoring', ++currentInsertStep, insertOperations, 'Restored files');
				getLogger('backup').pino.info(
					`Files Insertions Complete: ${Date.now() - dataInsertionStart}ms`
				);

				await chunker(checkedBackupData.data.associatedInfo, 1000, async (data) =>
					dbExecuteLogger(
						db.insert(associatedInfoTable).values(data),
						'Backup Restore - Insert Associated Info Table'
					)
				);
				emitProgress(
					'restoring',
					++currentInsertStep,
					insertOperations,
					'Restored associated info'
				);

				//Mark the backup as having a restored date.
				await dbExecuteLogger(
					db
						.update(backupTable)
						.set({ restoreDate: new Date(), ...updatedTime() })
						.where(eq(backupTable.id, id)),
					'Backup Restore - Update Backup Table'
				);

				const totalDuration = Date.now() - dataInsertionStart;
				console.log(`Phase 2 Complete: All data restored successfully (${totalDuration}ms)`);
				getLogger('backup').pino.info(
					`Database transaction completed successfully in ${totalDuration}ms`
				);
			});
			getLogger('backup').pino.info(
				`Backup Restored - ${backup.filename} - ${backup.createdAt.toISOString()}`
			);
			materializedViewActions.setRefreshRequired();

			// Emit completion event
			const duration = Date.now() - startTime;
			console.log('=== BACKUP RESTORE COMPLETED SUCCESSFULLY ===');
			console.log(`Total Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
			console.log(`Backup: ${backup.filename}`);
			getLogger('backup').pino.info(`Backup restore completed successfully in ${duration}ms`);
			emitEvent('backup.restore.completed', { backupId: id, includeUsers, duration, userId });
		} catch (error) {
			// Emit failure event
			const errorMessage = error instanceof Error ? error.message : String(error);
			emitEvent('backup.restore.failed', {
				backupId: id,
				includeUsers,
				error: errorMessage,
				userId
			});

			getLogger('backup').pino.error(
				{
					error: errorMessage
				},
				`Backup restore failed for backup ID: ${id}`
			);
			throw error;
		}
	},
	refreshList: async (): Promise<void> => {
		const db = getContextDB();
		const [backupsInDB, backupFiles] = await Promise.all([
			dbExecuteLogger(db.select().from(backupTable), 'Backup - Refresh List - Get Backups In DB'),
			backupFileHandler().list('')
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
			getLogger('backup').pino.info(
				`File ${index + 1} of ${filesNotInDB.length} took ${end.getTime() - start.getTime()}ms`
			);
		}
	},
	list: async (): Promise<
		(Omit<BackupTableType, 'information'> & { information: CurrentBackupSchemaInfoType })[]
	> => {
		const db = getContextDB();
		const listData = await dbExecuteLogger(
			db.select().from(backupTable).orderBy(desc(backupTable.createdAt)),
			'Backup - List'
		);

		return listData.map((data) => ({
			...data,
			information: backupSchemaInfoToLatest(data.information)
		}));
	},
	getBackupInfo: async ({
		id
	}: {
		id: string;
	}): Promise<
		| undefined
		| (Omit<BackupTableType, 'information'> & { information: CurrentBackupSchemaInfoType })
	> => {
		const db = getContextDB();
		const data = await dbExecuteLogger(
			db.select().from(backupTable).where(eq(backupTable.id, id)),
			'Backup - Get Info'
		);
		if (data.length === 0) {
			return undefined;
		}

		return { ...data[0], information: backupSchemaInfoToLatest(data[0].information) };
	},
	getBackupInfoByFilename: async ({ filename }: { filename: string }) => {
		const db = getContextDB();
		const data = await dbExecuteLogger(
			db.select().from(backupTable).where(eq(backupTable.filename, filename)),
			'Backup - Get Info By Filename'
		);
		if (data.length === 0) {
			return undefined;
		}

		return backupActions.getBackupInfo({ id: data[0].id });
	}
};

type BackupStructuredData = {
	latest: CurrentBackupSchemaType;
	original: CombinedBackupSchemaType;
	originalVersion: number;
};

const getBackupStructuredData = async ({
	filename
}: {
	filename: string;
}): Promise<BackupStructuredData> => {
	const backupExists = await backupFileHandler().fileExists(filename);

	if (!backupExists) {
		throw new Error('Backup File Not Found On Disk');
	}

	const isCompressed = filename.endsWith('.data');

	const loadedBackupData = isCompressed
		? ((await readFromMsgPackFile(filename)) as CombinedBackupSchemaType)
		: (superjson.parse(
				(await backupFileHandler().readToString(filename)).toString()
			) as CombinedBackupSchemaType);

	const backupDataParsed = combinedBackupSchema.parse(loadedBackupData);

	return {
		latest: backupSchemaToLatest(backupDataParsed),
		original: loadedBackupData,
		originalVersion: loadedBackupData.version
	};
};
