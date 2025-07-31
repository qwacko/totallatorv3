import type { Logger } from '../logger.js';

export interface RateLimiterOptions<T = void> {
  timeout: number;
  performAction: () => Promise<T>;
  logger?: Logger;
  name?: string;
}

export interface RateLimiter {
  updateLastRequest: () => void;
  clearTimeout: () => void;
  isActive: () => boolean;
}

/**
 * Generic rate limiter that delays action execution until no more requests come in
 * within the specified timeout period.
 * 
 * Usage:
 * ```typescript
 * const limiter = createRateLimiter({
 *   timeout: 5000,
 *   performAction: async () => {
 *     console.log('Action executed after 5s of inactivity');
 *     return 'result';
 *   },
 *   logger: myLogger,
 *   name: 'MyAction'
 * });
 * 
 * // Each call resets the timer
 * limiter.updateLastRequest();
 * limiter.updateLastRequest(); // Previous timeout is cleared, new one starts
 * // Action will execute 5 seconds after the last call
 * ```
 */
export function createRateLimiter<T = void>(options: RateLimiterOptions<T>): RateLimiter {
  const { timeout, performAction, logger, name = 'RateLimiter' } = options;
  let timeoutHandle: NodeJS.Timeout | undefined;

  const triggerAction = async () => {
    try {
      logger?.debug(`${name}: Executing rate-limited action`);
      await performAction();
      logger?.debug(`${name}: Rate-limited action completed`);
    } catch (error) {
      logger?.error(`${name}: Rate-limited action failed`, error);
    } finally {
      timeoutHandle = undefined;
    }
  };

  const updateLastRequest = () => {
    // Clear existing timeout if one is active
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      logger?.debug(`${name}: Reset timeout (was active)`);
    }

    // Start new timeout
    timeoutHandle = setTimeout(() => {
      triggerAction();
    }, timeout);
    
    logger?.debug(`${name}: Started timeout for ${timeout}ms`);
  };

  const clearTimeoutFn = () => {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      timeoutHandle = undefined;
      logger?.debug(`${name}: Timeout cleared manually`);
    }
  };

  const isActive = () => timeoutHandle !== undefined;

  return {
    updateLastRequest,
    clearTimeout: clearTimeoutFn,
    isActive,
  };
}