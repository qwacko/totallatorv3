import type { DBType } from '@totallator/database';
import type {  LogEntry, ConfigurationSelect,  LogLevelType } from '@totallator/log-database';
import type { ServerEnvSchemaType,LogFilterValidationOutputType,LogFilterConfigValidationType, } from '@totallator/shared';
import type { TypedEventEmitter } from './eventEmitter';
import type { LoggerFactory } from './logger';
import type  { RateLimiter, createRateLimiter } from './rateLimiter';

/**
 * Global application context containing shared resources and configuration.
 *
 * This context is initialized once during application startup and provides:
 * - Unique context identifier for log filtering
 * - Complete logging system with database integration
 * - Database connection and transaction capabilities
 * - Server environment configuration
 * - Materialized view refresh rate limiting
 * - Type-safe event emitter for application events
 */

export interface GlobalContext {
  /** Unique identifier for this context instance, useful for log filtering */
  contextId: string;

  /** Complete logging system with database integration and management functions */
  logging: {
    queryLoggedItems: (params: LogFilterValidationOutputType & { limit?: number; offset?: number; }) => Promise<LogEntry[]>;
    getLoggedItemsCount: (params: LogFilterValidationOutputType) => Promise<number>;
    getAllLogConfigurations: () => Promise<ConfigurationSelect[]>;
    setLogLevel: (data: {filter: LogFilterConfigValidationType, logLevel: LogLevelType}) => Promise<void>;
  };
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
