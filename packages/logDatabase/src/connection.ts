import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient, type Client } from '@libsql/client';
import * as schema from './schema/index.js';

let db: ReturnType<typeof drizzle> | null = null;
let client: Client | null = null;

export interface LogDatabaseConfig {
	url?: string;
	authToken?: string;
}

export async function initializeLogDatabase(config: LogDatabaseConfig = {}) {
	if (db) {
		return db;
	}

	const url = config.url || process.env.LOG_DATABASE_URL || 'file:./logs.db';
	const authToken = config.authToken || process.env.LOG_DATABASE_AUTH_TOKEN;

	client = createClient({
		url,
		authToken
	});
	
	db = drizzle(client, { schema });
	
	try {
		// Try different migration paths based on environment
		const migrationPaths = [
			'./dist/migrations',    // Built package
			'./src/migrations',     // Source during development
			'./migrations'          // Alternative path
		];
		
		let migrationSucceeded = false;
		let lastError: any = null;
		
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

export function getLogDatabase() {
	if (!db) {
		throw new Error('Log database not initialized. Call initializeLogDatabase() first.');
	}
	return db;
}

export function closeLogDatabase() {
	if (client) {
		client.close();
		client = null;
		db = null;
	}
}