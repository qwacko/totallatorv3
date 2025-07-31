import { type ServerEnvSchemaType } from '@totallator/shared';
import { createLogger, type Logger } from './logger.js';
import { createDatabase, migrateDatabase, type DBType } from '@totallator/database';
import { createRateLimiter, type RateLimiter } from './utils/rateLimiter.js';
import { createKeyValueStore, createBooleanKeyValueStore, createEnumKeyValueStore, type KeyValueStore, type BooleanKeyValueStore, type EnumKeyValueStore } from './utils/keyValueStore.js';

export interface GlobalContext {
  logger: Logger;
  db: DBType;
  serverEnv: ServerEnvSchemaType;
  postgresDatabase: any; // postgres connection for cleanup
  
  // Utilities
  keyValueStore: KeyValueStore;
  booleanKeyValueStore: BooleanKeyValueStore;
  enumKeyValueStore: <T extends string>() => EnumKeyValueStore<T>;
  
  // Rate limiter for materialized view refresh
  viewRefreshLimiter: RateLimiter;
  
  // Generic rate limiter factory
  createRateLimiter: typeof createRateLimiter;

}

let globalContext: GlobalContext | null = null;

export interface GlobalContextConfig {
  serverEnv: ServerEnvSchemaType;
  isBuilding?: boolean;
  viewRefreshAction?: () => Promise<boolean>;
}

export function initializeGlobalContext(config: GlobalContextConfig): GlobalContext {
  if (globalContext) {
    return globalContext;
  }

  const logger = createLogger(config.serverEnv.LOGGING, config.serverEnv.LOGGING_CLASSES);

  const { db, postgresDatabase } = createDatabase({
    postgresUrl: config.serverEnv.POSTGRES_URL || '',
    maxConnections: config.serverEnv.POSTGRES_MAX_CONNECTIONS,
    enableQueryLog: config.serverEnv.DB_QUERY_LOG,
    isDev: config.serverEnv.DEV,
    isBuilding: config.isBuilding || false,
    isTestEnv: config.serverEnv.TEST_ENV,
    logger: (message: string, data?: any) => logger.debug(message, data),
  });

  // Run migrations
  migrateDatabase({
    postgresUrl: config.serverEnv.POSTGRES_URL || '',
    maxConnections: config.serverEnv.POSTGRES_MAX_CONNECTIONS,
    enableQueryLog: config.serverEnv.DB_QUERY_LOG,
    isDev: config.serverEnv.DEV,
    isBuilding: config.isBuilding || false,
    isTestEnv: config.serverEnv.TEST_ENV,
    logger: (message: string) => logger.info(message),
  });

  // Create key-value store utilities
  const keyValueStore = createKeyValueStore({ db, logger });
  const booleanKeyValueStore = createBooleanKeyValueStore({ db, logger });
  const enumKeyValueStore = <T extends string>() => createEnumKeyValueStore<T>({ db, logger });

  // Create materialized view refresh rate limiter
  // This will be configured later by the application
  let refreshAction: (() => Promise<boolean>) | undefined;
  
  const viewRefreshLimiter = createRateLimiter({
    timeout: config.serverEnv.VIEW_REFRESH_TIMEOUT,
    performAction: async () => {
      if (config.viewRefreshAction) {
        return await config.viewRefreshAction();
      } else {
        logger.debug('Materialized view refresh triggered - no action configured yet');
        return false;
      }
    },
    logger,
    name: 'MaterializedViewRefresh',
  });

  globalContext = {
    logger,
    db,
    serverEnv: config.serverEnv,
    postgresDatabase,
    keyValueStore,
    booleanKeyValueStore,
    enumKeyValueStore,
    viewRefreshLimiter,
    createRateLimiter,
  };

  logger.info('Global context initialized with utilities');
  return globalContext;
}

export function getGlobalContext(): GlobalContext {
  if (!globalContext) {
    throw new Error('Global context not initialized. Call initializeGlobalContext first.');
  }
  return globalContext;
}

export function resetGlobalContext(): void {
  if (globalContext?.postgresDatabase) {
    globalContext.postgresDatabase.end();
  }
  globalContext = null;
}