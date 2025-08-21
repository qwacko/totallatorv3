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
 * Type-safe event emitter - used for asynchronous event handling throughout the app
 */
export {
  type AppEvents,
  type EventListener,
} from './eventEmitter.js';

