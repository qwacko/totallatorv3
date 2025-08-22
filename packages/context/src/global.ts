import { type ServerEnvSchemaType } from '@totallator/shared';
import { createLogger, LoggerDomain, type LoggingSystem } from './logger.js';
import { createDatabase, migrateDatabase } from '@totallator/database';
import { createRateLimiter } from './rateLimiter.js';
import { createEventEmitter } from './eventEmitter.js';
import { randomUUID } from 'crypto';
import { GlobalContext } from './GlobalContext.js';
import { initializeLogDatabase } from '@totallator/log-database';

let globalContext: GlobalContext | null = null;

/**
 * Configuration options for initializing the global context.
 */
export interface GlobalContextConfig {
  /** Server environment configuration */
  serverEnv: ServerEnvSchemaType;
  
  /** Whether the application is currently being built (affects migrations) */
  isBuilding?: boolean;
  
  /** Optional action to execute when materialized views need refreshing */
  viewRefreshAction?: () => Promise<boolean>;
  
  /** Path to database migration files */
  migrationsPath: string;

  /** Logging Database Client Factory (optional - if omitted, database logging will be disabled) */
  createLoggingDBClient?: () => Parameters<typeof initializeLogDatabase>[0];
}

/**
 * Initialize the global application context.
 * 
 * This should be called once during application startup to set up shared resources
 * including database connections, logging, and rate limiting for materialized views.
 * 
 * @param config Configuration options for context initialization
 * @returns The initialized global context
 * @throws Will throw if database connection fails
 */
export async function initializeGlobalContext(config: GlobalContextConfig): Promise<GlobalContext> {
  if (globalContext) {
    console.log("Reusing Existing Global Context");
    return globalContext;
  }

  console.log("Initializing Global Context");

  // Generate unique context ID for log filtering
  const contextId = randomUUID();

  // Initialize comprehensive logging system with database integration
  const loggingClient = config.createLoggingDBClient ? config.createLoggingDBClient() : null;
  if(!loggingClient){
    throw new Error("Logging database client is required for logging system initialization");
  }
  const logging = await createLogger(
    config.serverEnv.LOGGING,
    config.serverEnv.LOGGING_CLASSES,
    contextId,
    loggingClient
  );

  // Create database connection
  const { db, postgresDatabase } = createDatabase({
    postgresUrl: config.serverEnv.POSTGRES_URL || '',
    maxConnections: config.serverEnv.POSTGRES_MAX_CONNECTIONS,
    enableQueryLog: config.serverEnv.DB_QUERY_LOG,
    isDev: config.serverEnv.DEV,
    isBuilding: config.isBuilding || false,
    isTestEnv: config.serverEnv.TEST_ENV,
    logger: (message: string, data?: any) => logging.logger('database').pino.debug(data || {}, message),
    migrationsPath: config.migrationsPath,
  });

  // Run database migrations
  await migrateDatabase({
    postgresUrl: config.serverEnv.POSTGRES_URL || '',
    maxConnections: config.serverEnv.POSTGRES_MAX_CONNECTIONS,
    enableQueryLog: config.serverEnv.DB_QUERY_LOG,
    isDev: config.serverEnv.DEV,
    isBuilding: config.isBuilding || false,
    isTestEnv: config.serverEnv.TEST_ENV,
    logger: (message: string) => logging.logger('database').pino.info(message),
    migrationsPath: config.migrationsPath,
  });

  // Create materialized view refresh rate limiter
  const viewRefreshLimiter = createRateLimiter({
    timeout: config.serverEnv.VIEW_REFRESH_TIMEOUT,
    performAction: async () => {
      if (config.viewRefreshAction) {
        return await config.viewRefreshAction();
      } else {
        logging.logger('materialized-views').pino.debug('Materialized view refresh triggered - no action configured yet');
        return false;
      }
    },
    logger: logging.logger('materialized-views').pino,
    name: 'MaterializedViewRefresh',
  });

  // Create event emitter
  const eventEmitter = createEventEmitter(logging.logger('auth').pino);

  globalContext = {
    contextId,
    logging: {
      getAllLogConfigurations: logging.logDatabaseOps.getAllLogConfigurations,
      getLoggedItemsCount: logging.getLoggedItemsCount, 
      queryLoggedItems: logging.queryLoggedItems,
      setLogLevel: logging.setLogLevel
    },
    logger: logging.logger,
    db,
    serverEnv: config.serverEnv,
    postgresDatabase,
    viewRefreshLimiter,
    createRateLimiter,
    eventEmitter,
  };

  logging.logger('auth').info({ 
    code: 'CTX_001', 
    title: 'Global context initialized', 
    contextId 
  });
  
  return globalContext;
}

