import { drizzle } from 'drizzle-orm/better-sqlite3';
import sqlite from 'better-sqlite3';
import * as schema from './schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { logging } from '../logging';
import { serverEnv } from '../serverEnv';
import type { Logger } from 'drizzle-orm';

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

export const db = drizzle(sqliteDatabase, { schema, logger: new MyLogger() });

export type DBType = typeof db;

//Only Migrate If not TEST_ENV
if (!serverEnv.TEST_ENV) {
	logging.info('Migrating DB!!');
	migrate(db, { migrationsFolder: './src/lib/server/db/migrations' });
}
