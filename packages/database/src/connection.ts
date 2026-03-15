import { instrumentDrizzleClient } from '@kubiks/otel-drizzle';
import { type Logger } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

import { getActiveSpan } from '@totallator/telemetry';

import * as schema from './schema';

export interface DatabaseConfig {
	postgresUrl: string;
	maxConnections: number;
	enableQueryLog: boolean;
	isDev: boolean;
	isBuilding: boolean;
	isTestEnv: boolean;
	logger?: (message: string, data?: any) => void;
	migrationsPath: string;
}

class DatabaseLogger implements Logger {
	constructor(
		private enableLogger: boolean,
		private isDev: boolean,
		private logger?: (message: string, data?: any) => void
	) {}

	logQuery(query: string, params: unknown[]): void {
		const activeSpan = getActiveSpan();
		if (activeSpan) {
			activeSpan.addEvent('db.query', {
				'db.system': 'postgresql',
				'db.statement': query,
				'db.operation': query.trim().split(/\s+/, 1)[0]?.toUpperCase() || 'UNKNOWN'
			});
		}

		if (this.enableLogger && this.logger) {
			this.logger('DB Query', {
				query,
				params,
				isDev: this.isDev
			});
		}
	}
}

const getPostgresTelemetryOptions = (postgresUrl: string) => {
	try {
		const parsedUrl = new URL(postgresUrl);
		const dbName = parsedUrl.pathname.replace(/^\//, '') || undefined;
		const peerPort = parsedUrl.port ? Number(parsedUrl.port) : undefined;

		return {
			dbSystem: 'postgresql' as const,
			dbName,
			peerName: parsedUrl.hostname || undefined,
			peerPort
		};
	} catch {
		return {
			dbSystem: 'postgresql' as const
		};
	}
};

export function createDatabase(config: DatabaseConfig) {
	const postgresDatabase = postgres(config.isBuilding ? '' : config.postgresUrl || '', {
		debug: config.isDev,
		max: config.maxConnections
	});

	const db = drizzle(postgresDatabase, {
		schema,
		logger: new DatabaseLogger(config.enableQueryLog, config.isDev, config.logger)
	});

	if (!config.isBuilding && config.postgresUrl) {
		instrumentDrizzleClient(db, {
			...getPostgresTelemetryOptions(config.postgresUrl),
			captureQueryText: true,
			maxQueryTextLength: 2000
		});
	}

	return { db, postgresDatabase };
}

export async function migrateDatabase(config: DatabaseConfig) {
	if (config.isBuilding) {
		config.logger?.('Building, skipping migration!');
		return;
	}

	if (!config.isTestEnv && config.postgresUrl) {
		config.logger?.('Migrating DB!!');
		const migrationClient = postgres(config.postgresUrl, { max: 1 });

		try {
			const migrationDB = drizzle(migrationClient);
			await migrate(migrationDB, { migrationsFolder: config.migrationsPath });
			config.logger?.('DB Migration Complete');
		} finally {
			// Always close the migration connection to prevent connection leaks
			await migrationClient.end();
			config.logger?.('Migration connection closed');
		}
	} else if (!config.postgresUrl) {
		config.logger?.('No POSTGRES_URL found, skipping migration!');
	} else if (config.isTestEnv) {
		config.logger?.('TEST_ENV is true, skipping migration!');
	}
}

export function printMaterializedViews() {
	// This function would need to be implemented or imported
	// For now, keeping it simple
	console.log('Materialized views configured');
}

export type CoreDBType = ReturnType<typeof createDatabase>['db'];
export type TransactionType = Parameters<Parameters<CoreDBType['transaction']>[0]>[0];
export type DBType = CoreDBType | TransactionType;
export type PostgresDBType = CoreDBType;
export type PostgresTransactionType = TransactionType;
