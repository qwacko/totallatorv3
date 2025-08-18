import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient, type Client } from '@libsql/client';
import * as schema from './schema/index.js';


export type LogDBType = ReturnType<typeof getDB>;

export interface LogDatabaseConfig {
	url?: string;
	authToken?: string;
}

const getDB = (client: Client) =>  drizzle(client, { schema });

export async function initializeLogDatabase(config: LogDatabaseConfig = {}) {

	const url = config.url || process.env.LOG_DATABASE_URL || 'file:logs.db';
	const authToken = config.authToken || process.env.LOG_DATABASE_AUTH_TOKEN;

	const client = createClient({url});

	const db = getDB(client)
	
	
	try {
		// Try different migration paths based on environment
		const migrationPaths = [
			'./dist/migrations',    // Built package
			'./src/migrations',     // Source during development
			'./migrations',          // Alternative path
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
	
	return db;
}
