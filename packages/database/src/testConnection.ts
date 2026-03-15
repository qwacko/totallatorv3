import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { type Logger } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

import * as schema from './schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultTestMigrationsPath = path.resolve(__dirname, '../src/test-migrations');

export interface PGliteTestDatabaseConfig {
	migrationsPath?: string;
	logger?: Logger;
	dataDir?: string;
}

const enableExtensions = async (client: PGlite) => {
	await client.exec(`
		CREATE EXTENSION IF NOT EXISTS pgcrypto;
		CREATE EXTENSION IF NOT EXISTS pg_trgm;
		CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
	`);
};

export const createPGliteTestDatabase = async (config: PGliteTestDatabaseConfig) => {
	const migrationsPath = config.migrationsPath || defaultTestMigrationsPath;
	const client = await PGlite.create({
		dataDir: config.dataDir || 'memory://totallator-test',
		extensions: {
			pgcrypto,
			pg_trgm,
			uuid_ossp
		}
	});

	await enableExtensions(client);

	const db = drizzle(client, {
		schema,
		logger: config.logger
	});

	await migrate(db, {
		migrationsFolder: migrationsPath
	});

	return { db, client };
};

export type PGliteDBType = Awaited<ReturnType<typeof createPGliteTestDatabase>>['db'];
export type PGliteTransactionType = Parameters<Parameters<PGliteDBType['transaction']>[0]>[0];
