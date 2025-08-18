import { type ServerEnvSchemaType } from '@totallator/shared';
import { createLogger, type LoggerFactory } from './logger.js';
import { createDatabase, migrateDatabase, type DBType } from '@totallator/database';
import { createRateLimiter, type RateLimiter } from './rateLimiter.js';
import { createEventEmitter, type TypedEventEmitter } from './eventEmitter.js';
import { randomUUID } from 'crypto';

/**
 * Global application context containing shared resources and configuration.
 * 
 * This context is initialized once during application startup and provides:
 * - Unique context identifier for log filtering
 * - Logger instance configured with application settings
 * - Database connection and transaction capabilities
 * - Server environment configuration
 * - Materialized view refresh rate limiting
 * - Type-safe event emitter for application events
 */
export interface GlobalContext {
  /** Unique identifier for this context instance, useful for log filtering */
  contextId: string;
  
  /** Application logger factory with domain-specific child logger support */
  logger: LoggerFactory;
  
  /** Database connection with transaction support */
  db: DBType;
  
  /** Server environment configuration and settings */
  serverEnv: ServerEnvSchemaType;
  
  /** Raw postgres connection for cleanup operations */
  postgresDatabase: any;
  
  /** Rate limiter for materialized view refresh operations */
  viewRefreshLimiter: RateLimiter;
  
  /** Factory function for creating additional rate limiters */
  createRateLimiter: typeof createRateLimiter;
  
  /** Type-safe event emitter for application events */
  eventEmitter: TypedEventEmitter;
}

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
export function initializeGlobalContext(config: GlobalContextConfig): GlobalContext {
  if (globalContext) {
    return globalContext;
  }

  // Generate unique context ID for log filtering
  const contextId = randomUUID();

  // Initialize logger with configured levels and classes
  const logger = createLogger(config.serverEnv.LOGGING, config.serverEnv.LOGGING_CLASSES, contextId);

  // Create database connection
  const { db, postgresDatabase } = createDatabase({
    postgresUrl: config.serverEnv.POSTGRES_URL || '',
    maxConnections: config.serverEnv.POSTGRES_MAX_CONNECTIONS,
    enableQueryLog: config.serverEnv.DB_QUERY_LOG,
    isDev: config.serverEnv.DEV,
    isBuilding: config.isBuilding || false,
    isTestEnv: config.serverEnv.TEST_ENV,
    logger: (message: string, data?: any) => logger('database').pino.debug(data || {}, message),
    migrationsPath: config.migrationsPath,
  });

  // Run database migrations
  migrateDatabase({
    postgresUrl: config.serverEnv.POSTGRES_URL || '',
    maxConnections: config.serverEnv.POSTGRES_MAX_CONNECTIONS,
    enableQueryLog: config.serverEnv.DB_QUERY_LOG,
    isDev: config.serverEnv.DEV,
    isBuilding: config.isBuilding || false,
    isTestEnv: config.serverEnv.TEST_ENV,
    logger: (message: string) => logger('database').pino.info(message),
    migrationsPath: config.migrationsPath,
  });

  // Create materialized view refresh rate limiter
  const viewRefreshLimiter = createRateLimiter({
    timeout: config.serverEnv.VIEW_REFRESH_TIMEOUT,
    performAction: async () => {
      if (config.viewRefreshAction) {
        return await config.viewRefreshAction();
      } else {
        logger('materialized-views').pino.debug('Materialized view refresh triggered - no action configured yet');
        return false;
      }
    },
    logger: logger('materialized-views').pino,
    name: 'MaterializedViewRefresh',
  });

  // Create event emitter
  const eventEmitter = createEventEmitter(logger('auth').pino);

  globalContext = {
    contextId,
    logger,
    db,
    serverEnv: config.serverEnv,
    postgresDatabase,
    viewRefreshLimiter,
    createRateLimiter,
    eventEmitter,
  };

  logger('auth').info({ 
    code: 'CTX_001', 
    title: 'Global context initialized', 
    contextId 
  });
  return globalContext;
}

