// import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './postgres/schema';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { logging } from '../logging';
import { serverEnv } from '../serverEnv';
import { type Logger } from 'drizzle-orm';
import postgres from 'postgres';
import { materializedViewActions } from './actions/materializedViewActions';

const usedURL = serverEnv.POSTGRES_URL;

const migrationClient = postgres(usedURL || '', { max: 1 });
const migrationDB = drizzle(migrationClient);
export const postgresDatabase = postgres(usedURL || '', {
	debug: serverEnv.DEV
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

export const db = drizzle(postgresDatabase, {
	schema,
	logger: new MyLogger()
});

export type DBType = typeof db;

//Only Migrate If not TEST_ENV and if there is a POSTGRES_URL
if (!serverEnv.TEST_ENV && serverEnv.POSTGRES_URL) {
	logging.info('Migrating DB!!');
	migrate(migrationDB, { migrationsFolder: './src/lib/server/db/postgres/migrations' });
	await materializedViewActions.initialize(db);
} else if (!serverEnv.POSTGRES_URL) {
	logging.warn('No POSTGRES_URL found, skipping migration!');
} else if (serverEnv.TEST_ENV) {
	logging.warn('TEST_ENV is true, skipping migration!');
}
