import pino from 'pino';

/**
 * Configuration options for creating a rate limiter.
 */
export interface RateLimiterOptions<T = void> {
  /** Timeout in milliseconds before action is executed */
  timeout: number;
  /** Action to perform after timeout period */
  performAction: () => Promise<T>;
  /** Optional pino logger for debugging */
  logger?: pino.Logger;
  /** Optional name for logging purposes */
  name?: string;
}

/**
 * Rate limiter interface providing control methods.
 */
export interface RateLimiter {
  /** Update the last request time, resetting the timeout */
  updateLastRequest: () => void;
  /** Clear any pending timeout */
  clearTimeout: () => void;
  /** Check if a timeout is currently active */
  isActive: () => boolean;
}

/**
 * Create a rate limiter that delays action execution until no more requests 
 * come in within the specified timeout period.
 * 
 * This is used internally for materialized view refresh rate limiting.
 * Each call to updateLastRequest() resets the timer.
 * 
 * @param options Rate limiter configuration
 * @returns Rate limiter instance
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
      logger?.error({ error }, `${name}: Rate-limited action failed`);
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