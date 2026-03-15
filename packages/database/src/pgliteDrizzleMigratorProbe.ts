import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

import * as schema from './schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testMigrationsPath = path.resolve(__dirname, '../src/test-migrations');

const enableExtensions = async (client: PGlite) => {
	await client.exec(`
		CREATE EXTENSION IF NOT EXISTS pgcrypto;
		CREATE EXTENSION IF NOT EXISTS pg_trgm;
		CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
	`);
};

const main = async () => {
	const client = await PGlite.create({
		dataDir: `memory://totallator-drizzle-migrator-probe`,
		extensions: {
			pgcrypto,
			pg_trgm,
			uuid_ossp
		}
	});

	try {
		await enableExtensions(client);

		const db = drizzle(client, { schema });

		console.time('drizzle-pglite-migrate');
		await migrate(db, { migrationsFolder: testMigrationsPath });
		console.timeEnd('drizzle-pglite-migrate');

		const result = await client.query(
			`select table_schema, table_name from information_schema.tables where table_schema not in ('pg_catalog', 'information_schema') order by table_schema, table_name limit 10`
		);

		console.log(
			JSON.stringify(
				{
					success: true,
					tableCountPreview: result.rows.length,
					firstTables: result.rows
				},
				null,
				2
			)
		);
	} finally {
		await client.close();
	}
};

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
