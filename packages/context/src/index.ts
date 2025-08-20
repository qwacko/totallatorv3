/**
 * @totallator/context - Application Context Management
 * 
 * This package provides centralized context management for the Totallator application,
 * including global context initialization, request-scoped context, database access,
 * and transaction management using AsyncLocalStorage.
 */

// === NEW CONTEXT SYSTEM (PRIMARY API) ===
// Modern, type-safe context management for monorepo usage

/**
 * Primary context API - use these throughout your application
 */
export {
  getContext,
  runInTransaction,
  hookBuilder,
  getContextDB,
  getLogger,
  getEventEmitter,
  getServerEnv,
  getUserId,
  getRequestId,
  getContextStore,
  runInTransactionWithLogging,
  type GlobalContext,
  type EnhancedRequestContext,
  type CombinedContext,
} from './newContext.js';

/**
 * Low-level ContextHandler for advanced usage
 */
export {
  type HookBuilderConfig,
  type HookBuilderResult,
  ContextHandler,
  createContextHandler,
} from './contextHandler.js';

// === LEGACY CONTEXT MANAGEMENT ===
// These are maintained for backward compatibility but consider migrating to ContextHandler

/**
 * Global application context - used once during app initialization
 */
export {
  type GlobalContextConfig,
  initializeGlobalContext,
} from './global.js';

/**
 * Request-scoped context - used in SvelteKit request handling
 */
export {
  type RequestContext,
  createRequestContext,
} from './request.js';

/**
 * AsyncLocalStorage-based context access - used throughout business logic
 * getContextDB is the primary database access method used across the app
 */
export {
  type ContextStore,
  getGlobalContext as getGlobalContextFromStore,
  getRequestContext as getRequestContextFromStore,
  getContext as getContextStoreLegacy,
  getContextDB as getContextDBLegacy,
  getContextEventEmitter,
  runWithContext,
} from './asyncStorage.js';

/**
 * Transaction management - used for database operations requiring transactions
 */
export {
  runInTransactionWithLogging as runInTransactionWithLoggingLegacy,
  runRequestInTransaction,
} from './transaction.js';

/**
 * Type-safe event emitter - used for asynchronous event handling throughout the app
 */
export {
  type AppEvents,
  type EventListener,
  type TypedEventEmitter,
  createEventEmitter,
} from './eventEmitter.js';

/**
 * Logger types and utilities - used for typed logging throughout the app
 */
export {
  type LoggerDomain,
  type LoggerAction,
  type LoggerFactory,
  type LoggerInstance,
  type StructuredLogData,
  type StructuredLogger,
  type LoggingSystem,
  loggerDomains,
  loggerActions,
  createLogger,
} from './logger.js';

/**
 * Re-exported shared enums and types from @totallator/log-database
 * These provide consistency across packages for logging-related types
 */
export {
  type LogLevelType,
  type LogDomainType,
  type LogActionType,
  type LogDestinationType,
  logDomainEnum,
  logActionEnum,
  logDestinationEnum,
  logLevelEnum,
  logConfigFilterValidation, logFilterValidation, type LogFilterConfigValidationType,type LogFilterConfigValidationOutputType, type LogFilterValidationType, type LogFilterValidationOutputType 
} from '@totallator/log-database';