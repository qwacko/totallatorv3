import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from './schema/index.js';

export type LogDBType = ReturnType<typeof getDB>;

export interface LogDatabaseConfig {
	path?: string;
}

const getDB = (client: Database.Database) => drizzle(client, { schema });

export async function initializeLogDatabase(config: LogDatabaseConfig = {}) {

	const dbPath = config.path || process.env.LOG_DATABASE_PATH || 'logs.db';

	const client = new Database(dbPath);

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
