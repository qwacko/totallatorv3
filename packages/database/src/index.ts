// Export database connection and types
export { createDatabase, migrateDatabase, printMaterializedViews } from './connection';
export type { DatabaseConfig, CoreDBType, TransactionType, DBType } from './connection';

// Export all schema definitions
export * from './schema/index.js';

export * from './backups/backupSchema.js';
