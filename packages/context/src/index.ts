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

// Re-export commonly used types for convenience
export type { ServerEnvSchemaType } from '@totallator/shared';
export type { DBType, UserDBType, SessionDBType } from '@totallator/database';