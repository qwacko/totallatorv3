// import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import sqlite from 'better-sqlite3';
// import * as schema from './schema';
import * as postgresSchema from './postgres/schema';
// import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator';
import { logging } from '../logging';
import { serverEnv } from '../serverEnv';
import fs from 'fs/promises';
import type { Logger } from 'drizzle-orm';
import postgres from 'postgres'

const usedURL = serverEnv.POSTGRES_URL;

const migrationClient = postgres(usedURL, { max: 1 });
const migrationDB = drizzlePostgres(migrationClient)
export const postgresDatabase = postgres(usedURL);

export const sqliteDatabase = sqlite(serverEnv.DATABASE_FILE);

sqliteDatabase.pragma('journal_mode = WAL');

const enableLogger = serverEnv.DB_QUERY_LOG;

class MyLogger implements Logger {
	logQuery(query: string, params: unknown[]): void {
		if (query.startsWith('update') && enableLogger && serverEnv.DEV) {
			console.log({ query, params });
		}
	}
}

// export const db = drizzle(sqliteDatabase, { schema, logger: new MyLogger() });
export const db = drizzlePostgres(postgresDatabase, { schema: postgresSchema, logger: new MyLogger() });

export type DBType = typeof db;

//Only Migrate If not TEST_ENV
if (!serverEnv.TEST_ENV) {
	logging.info('Migrating DB!!');
	// migrate(db, { migrationsFolder: './src/lib/server/db/migrations' });
	migratePostgres(migrationDB, { migrationsFolder: './src/lib/server/db/postgres/migrations' });
	// const query = await postgresDB.select().from(postgresSchema.user).limit(1);
	// logging.info('Postgres DB Connected', query);
}

// migrate(db, { migrationsFolder: './src/lib/server/db/migrations' });

export const backupDB = async (title = 'backup') => {
	const date = new Date();
	try {
		await sqliteDatabase.backup(`${serverEnv.BACKUP_DIR}${date.toISOString()}-${title}.sqlite3`);
		return;
	} catch (e) {
		logging.error('Backup Failed', e);
		return;
	}
};

export const restoreDB = async (backupName: string) => {
	const targetDir = serverEnv.BACKUP_DIR;

	const backupFile = (await fs.readdir(targetDir, { recursive: true })).find(
		(file) => file === backupName
	);

	if (!backupFile) {
		throw new Error('Backup File Not Found');
	}

	await backupDB('Before Restore');

	await fs.copyFile(`${targetDir}/${backupFile}`, serverEnv.DATABASE_FILE);

	return;
};

export const deleteBackup = async (backupName: string) => {
	const targetDir = serverEnv.BACKUP_DIR;

	const backupFile = (await fs.readdir(targetDir, { recursive: true })).find(
		(file) => file === backupName
	);

	if (!backupFile) {
		throw new Error('Backup File Not Found');
	}

	await fs.unlink(`${targetDir}/${backupFile}`);

	return;
};

export const getBackupList = async () => {
	const targetDir = serverEnv.BACKUP_DIR;

	return (await fs.readdir(targetDir, { recursive: true })).sort((a, b) => b.localeCompare(a));
};
