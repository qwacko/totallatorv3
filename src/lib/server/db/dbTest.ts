import { drizzle } from 'drizzle-orm/better-sqlite3';
import sqlite, { type Database } from 'better-sqlite3';
import * as schema from './schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { logging } from '../logging';
import { serverEnv } from '../serverEnv';
import type { Logger } from 'drizzle-orm';
import type { DBType } from './db';
import fs from 'fs/promises';

export const createTestDB = async (suffix: string) => {
	const filename = `${serverEnv.DATABASE_FILE}-test-${suffix}`;
	const sqliteDatabase = sqlite(filename);

	sqliteDatabase.pragma('journal_mode = WAL');

	const enableLogger = serverEnv.DB_QUERY_LOG;

	class MyLogger implements Logger {
		logQuery(query: string, params: unknown[]): void {
			if (query.startsWith('update') && enableLogger && serverEnv.DEV) {
				console.log({ query, params });
			}
		}
	}

	const testDB = drizzle(sqliteDatabase, { schema, logger: new MyLogger() });

	logging.info('Migrating Test DB!!');
	migrate(testDB, { migrationsFolder: './src/lib/server/db/migrations' });

	return { db: testDB, sqliteDatabase, filename };
};

export const initialiseTestDB = async (db: DBType) => {
	db.delete(schema.account).execute();
	db.delete(schema.tag).execute();
	db.delete(schema.bill).execute();
	db.delete(schema.budget).execute();
	db.delete(schema.category).execute();
	db.delete(schema.label).execute();
	db.delete(schema.labelsToJournals).execute();
	db.delete(schema.importItemDetail).execute();
	db.delete(schema.importMapping).execute();
	db.delete(schema.importTable).execute();
	db.delete(schema.journalEntry).execute();
	db.delete(schema.transaction).execute();

	db.delete(schema.reusableFilter).execute();
	db.delete(schema.summaryTable).execute();
};

export const tearDownTestDB = async ({
	sqliteDatabase,
	filename
}: {
	sqliteDatabase: Database;
	filename: string;
}) => {
	sqliteDatabase.close();

	//Delete the test file
	await fs.unlink(filename);
};
