/**
 * New context system implementation using ContextHandler
 *
 * This replaces the legacy AsyncLocalStorage-based context system with a more
 * flexible, type-safe approach that works better in monorepo environments.
 */
import type { SessionDBType, UserDBType } from '@totallator/database';

import { createContextHandler } from './contextHandler.js';
import type { GlobalContext } from './GlobalContext.js';
import { LoggerAction, LoggerDomain } from './logger.js';

/**
 * Enhanced request context that includes all the original fields plus additional metadata
 */
export interface EnhancedRequestContext {
	/** Unique identifier for this request */
	requestId: string;

	/** Request start timestamp for performance tracking */
	startTime: number;

	/** Route ID from SvelteKit */
	routeId: string;

	/** URL pathname */
	url: string;

	/** HTTP method */
	method: string;

	/** Authenticated user, if present */
	user?: UserDBType;

	/** User session, if present */
	session?: SessionDBType;

	/** Client user agent string */
	userAgent?: string;

	/** Client IP address */
	ip: string;
}

/**
 * Create the new context handler with your existing types and convenient getters
 */
const { getContext, runInTransaction, hookBuilder } = createContextHandler<
	GlobalContext,
	EnhancedRequestContext
>();

// Export core functions
export { getContext, runInTransaction, hookBuilder };

// Create convenient getters that users can import - fully typed!
export const getContextDB = () => getContext().global.db;
export const getLogger = (domain: LoggerDomain, action?: LoggerAction) => {
	if (action !== undefined) {
		return getContext().global.logger(domain, action);
	} else {
		return getContext().global.logger(domain);
	}
};
export const getEventEmitter = () => getContext().global.eventEmitter;
export const getServerEnv = () => getContext().global.serverEnv;
export const getUserId = () => getContext().request.user?.id;
export const getRequestId = () => getContext().request.requestId;

// Additional utility functions for backward compatibility
export const getContextStore = getContext; // Alias for backward compatibility

/**
 * Run a function within a database transaction with comprehensive logging
 */
export async function runInTransactionWithLogging<T>(
	title: string,
	callback: (txDb: any) => Promise<T>
): Promise<T> {
	const context = getContext();
	const { global } = context;
	const enableTransactionLogging = global.serverEnv.TRANSACTIONLOG_ENABLE;
	const enableTransactionStartLogging = global.serverEnv.TRANSACTIONLOG_ENABLESTART;
	const transactionLoggingThreshold = global.serverEnv.TRANSACTIONLOG_TIME_MS;

	// If logging is disabled, run without timing overhead
	if (!enableTransactionLogging) {
		return global.db.transaction(callback);
	}

	const start = Date.now();
	if (enableTransactionStartLogging) {
		global.logger('database').info({
			code: 'TXN_001',
			title: `Transaction "${title}" started`
		});
	}

	try {
		const result = await global.db.transaction(callback);
		const duration = Date.now() - start;
		if (duration > transactionLoggingThreshold) {
			global.logger('database').info({
				code: 'TXN_002',
				title: `Transaction "${title}" took ${duration}ms`,
				duration,
				transactionTitle: title
			});
		}
		return result;
	} catch (err) {
		const duration = Date.now() - start;
		global.logger('database').error({
			code: 'TXN_003',
			title: `Transaction "${title}" failed after ${duration}ms`,
			duration,
			transactionTitle: title,
			error: err
		});
		throw err;
	}
}

// Re-export types for convenience
export type { CombinedContext } from './contextHandler.js';
export type { GlobalContext } from './GlobalContext.js';
