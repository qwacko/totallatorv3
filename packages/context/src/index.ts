// Global Context
export {
  type GlobalContext,
  type GlobalContextConfig,
  initializeGlobalContext,
  getGlobalContext,
  resetGlobalContext,
} from './global.js';

// Request Context
export {
  type RequestContext,
  createRequestContext,
  getRequestDuration,
  isAuthenticated,
  requireAuth,
} from './request.js';

// Utilities
export {
  createRateLimiter,
  type RateLimiter,
  type RateLimiterOptions,
} from './utils/rateLimiter.js';

export {
  createKeyValueStore,
  createBooleanKeyValueStore,
  createEnumKeyValueStore,
  type KeyValueStore,
  type BooleanKeyValueStore,
  type EnumKeyValueStore,
} from './utils/keyValueStore.js';

// Logger
export { createLogger, type Logger, type LogClass } from './logger.js';

// AsyncLocalStorage Context Management
export {
  type ContextStore,
  type TransactionContextStore,
  contextStorage,
  transactionStorage,
  getGlobalContext as getGlobalContextFromStore,
  getRequestContext as getRequestContextFromStore,
  getContext as getContextStore,
  getContextDB,
  runWithContext,
} from './asyncStorage.js';

// Transaction Context Management
export {
  runInTransaction,
  runInTransactionWithLogging,
  runRequestInTransaction,
} from './transaction.js';

// Re-export commonly used types for convenience
export type { ServerEnvSchemaType } from '@totallator/shared';
export type { DBType, UserDBType, SessionDBType, TransactionType } from '@totallator/database';