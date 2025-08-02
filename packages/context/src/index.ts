/**
 * @totallator/context - Application Context Management
 * 
 * This package provides centralized context management for the Totallator application,
 * including global context initialization, request-scoped context, database access,
 * and transaction management using AsyncLocalStorage.
 */

// === CORE CONTEXT MANAGEMENT ===
// These are the primary APIs used throughout the application

/**
 * Global application context - used once during app initialization
 */
export {
  type GlobalContext,
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
  getContext as getContextStore,
  getContextDB,
  runWithContext,
} from './asyncStorage.js';

/**
 * Transaction management - used for database operations requiring transactions
 */
export {
  runInTransactionWithLogging,
  runRequestInTransaction,
} from './transaction.js';