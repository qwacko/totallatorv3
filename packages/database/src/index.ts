// Export database connection and types
export { createDatabase, migrateDatabase, printMaterializedViews } from './connection';
export type {
	DatabaseConfig,
	CoreDBType,
	TransactionType,
	DBType,
	PostgresDBType,
	PostgresTransactionType
} from './connection';
export { createPGliteTestDatabase } from './testConnection';
export type { PGliteDBType, PGliteTransactionType } from './testConnection';

// Export all schema definitions
export * from './schema/index.js';

export * from './backups/backupSchema.js';
