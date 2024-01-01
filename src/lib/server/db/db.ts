// import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import * as postgresSchema from './postgres/schema';
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator';
import { logging } from '../logging';
import { serverEnv } from '../serverEnv';
import type { Logger } from 'drizzle-orm';
import postgres from 'postgres';

const usedURL = serverEnv.POSTGRES_URL;

const migrationClient = postgres(usedURL, { max: 1 });
const migrationDB = drizzlePostgres(migrationClient);
export const postgresDatabase = postgres(usedURL, {
	debug: true
});

const enableLogger = serverEnv.DB_QUERY_LOG;

class MyLogger implements Logger {
	logQuery(query: string, params: unknown[]): void {
		// console.log({ query, params });
		if (query.startsWith('update') && enableLogger && serverEnv.DEV) {
			console.log({ query, params });
		}
	}
}

export const db = drizzlePostgres(postgresDatabase, {
	schema: postgresSchema,
	logger: new MyLogger()
});

export type DBType = typeof db;

//Only Migrate If not TEST_ENV
if (!serverEnv.TEST_ENV) {
	logging.info('Migrating DB!!');
	migratePostgres(migrationDB, { migrationsFolder: './src/lib/server/db/postgres/migrations' });
}
