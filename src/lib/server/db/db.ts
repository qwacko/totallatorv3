// import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './postgres/schema';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { logging } from '../logging';
import { serverEnv } from '../serverEnv';
import { type Logger } from 'drizzle-orm';
import postgres from 'postgres';
import {
	accountMaterializedView,
	billMaterializedView,
	journalExtendedView,
	tagMaterializedView,
	categoryMaterializedView,
	budgetMaterializedView,
	labelMaterializedView,
	dateRangeMaterializedView,
	journalView,
	accountView,
	tagView,
	billView,
	budgetView,
	categoryView,
	labelView
} from './postgres/schema/materializedViewSchema';
import { printMaterializedViewList } from './actions/helpers/printMaterializedViewList';
import { building } from '$app/environment';

const usedURL = serverEnv.POSTGRES_URL;

const enableLogger = serverEnv.DB_QUERY_LOG;

class MyLogger implements Logger {
	logQuery(query: string, params: unknown[]): void {
		if (query.startsWith('update') && enableLogger && serverEnv.DEV) {
			logging.info({ query, params });
		}
	}
}

export const postgresDatabase = postgres(building ? '' : usedURL || '', {
	debug: serverEnv.DEV,
	max: serverEnv.POSTGRES_MAX_CONNECTIONS
});

export const db = drizzle(postgresDatabase, {
	schema,
	logger: new MyLogger()
});

export type CoreDBType = typeof db;
export type TransactionType = Parameters<Parameters<CoreDBType['transaction']>[0]>[0];
export type DBType = CoreDBType | TransactionType;
// export type DBOrTransactionType = DBType | TransactionType;

//Only Migrate If not TEST_ENV and if there is a POSTGRES_URL
if (building) {
	logging.warn('Building, skipping migration!');
} else if (!serverEnv.TEST_ENV && serverEnv.POSTGRES_URL) {
	logging.info('Migrating DB!!');
	const migrationClient = postgres(usedURL || '', { max: 1 });
	const migrationDB = drizzle(migrationClient);
	await migrate(migrationDB, { migrationsFolder: './src/lib/server/db/postgres/migrations' });
	logging.info('DB Migration Complete');
} else if (!serverEnv.POSTGRES_URL) {
	logging.warn('No POSTGRES_URL found, skipping migration!');
} else if (serverEnv.TEST_ENV) {
	logging.warn('TEST_ENV is true, skipping migration!');
}

//Print Materialized View Logic if DEV
if (serverEnv.DEV) {
	printMaterializedViewList(
		[
			journalExtendedView,
			accountMaterializedView,
			tagMaterializedView,
			billMaterializedView,
			budgetMaterializedView,
			categoryMaterializedView,
			labelMaterializedView,
			dateRangeMaterializedView
		],
		[journalView, accountView, tagView, billView, budgetView, categoryView, labelView]
	);
}
