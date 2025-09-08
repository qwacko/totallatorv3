import type { Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

import * as schema from './schema/index.js';

export type LogDBType = ReturnType<typeof getDB>;

// Accept a client from outside rather than creating one
const getDB = (client: Client) => drizzle(client, { schema });

export async function initializeLogDatabase(client: Client) {
	console.log('[initializeLogDatabase] Starting with client:', {
		clientProvided: !!client,
		clientType: typeof client
	});

	const db = getDB(client);
	console.log('[initializeLogDatabase] Created db object:', {
		dbExists: !!db,
		dbType: typeof db,
		hasSelect: db && typeof db.select === 'function',
		dbKeys: db ? Object.keys(db).slice(0, 10) : 'no db'
	});

	try {
		// Try different migration paths based on environment
		const migrationPaths = [
			'./dist/migrations', // Built package
			'./src/migrations', // Source during development
			'./migrations', // Alternative path
			'./packages/logDatabase/src/migrations',
			'./../../packages/logDatabase/dist/migrations',
			'./../../packages/logDatabase/src/migrations'
		];

		let migrationSucceeded = false;
		let lastError: any = null;

		console.log('Current working directory:', process.cwd());

		for (const path of migrationPaths) {
			try {
				console.log(`Attempting to migrate from: ${path}`);
				await migrate(db, { migrationsFolder: path });
				console.log(`✅ Migration successful from: ${path}`);
				migrationSucceeded = true;
				break;
			} catch (e) {
				console.log(`❌ Migration failed from ${path}:`, (e as Error).message);
				lastError = e;
				continue;
			}
		}

		if (!migrationSucceeded) {
			console.error('Log database migration failed - all paths exhausted. Last error:', lastError);
		}
	} catch (error) {
		console.warn('Log database migration failed:', error);
	}

	console.log('[initializeLogDatabase] Returning db object:', {
		dbExists: !!db,
		dbType: typeof db,
		hasSelect: db && typeof db.select === 'function'
	});

	return db;
}
