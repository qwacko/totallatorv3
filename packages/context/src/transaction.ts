import type { DBType, TransactionType } from '@totallator/database';
import { getGlobalContext, getRequestContext, runWithContext, contextStorage, transactionStorage, type TransactionContextStore } from './asyncStorage.js';

/**
 * Get the transaction database from the current transaction context
 */
export function getTransactionDB(): TransactionType {
  const transactionStore = transactionStorage.getStore();
  if (transactionStore) {
    return transactionStore.transactionDb;
  }
  
  // Fallback to regular context DB if not in transaction
  const store = contextStorage.getStore();
  if (!store) {
    throw new Error('Neither transaction nor regular context is available. Make sure the request is running within the appropriate context.');
  }
  return store.global.db as TransactionType;
}

/**
 * Get the database, preferring transaction DB if available
 * @deprecated Use getContextDB from asyncStorage.js instead - they now do the same thing
 */
export function getContextOrTransactionDB(): DBType | TransactionType {
  const transactionStore = transactionStorage.getStore();
  if (transactionStore) {
    return transactionStore.transactionDb;
  }
  
  const store = contextStorage.getStore();
  if (!store) {
    throw new Error('No context available. Make sure the request is running within the AsyncLocalStorage context.');
  }
  return store.global.db;
}

/**
 * Run a function within a database transaction, preserving async context
 */
export async function runInTransaction<T>(
  callback: (txDb: TransactionType) => Promise<T>
): Promise<T> {
  const globalContext = getGlobalContext();
  const requestContext = getRequestContext();
  
  return globalContext.db.transaction(async (txDb) => {
    // Create new context store with transaction DB
    const transactionContext: TransactionContextStore = {
      global: globalContext,
      request: requestContext,
      transactionDb: txDb,
    };
    
    // Run the callback within the transaction context
    return transactionStorage.run(transactionContext, () => callback(txDb));
  });
}

/**
 * Enhanced transaction wrapper that includes timing and logging
 */
export async function runInTransactionWithLogging<T>(
  title: string,
  callback: (txDb: TransactionType) => Promise<T>
): Promise<T> {
  const globalContext = getGlobalContext();
  const enableTransactionLogging = globalContext.serverEnv.TRANSACTIONLOG_ENABLE;
  const enableTransactionStartLogging = globalContext.serverEnv.TRANSACTIONLOG_ENABLESTART;
  const transactionLoggingThreshold = globalContext.serverEnv.TRANSACTIONLOG_TIME_MS;
  
  if (!enableTransactionLogging) {
    return runInTransaction(callback);
  }
  
  const start = Date.now();
  if (enableTransactionStartLogging) {
    globalContext.logger.info(`Transaction "${title}" started`);
  }
  
  try {
    const result = await runInTransaction(callback);
    const duration = Date.now() - start;
    if (duration > transactionLoggingThreshold) {
      globalContext.logger.info(`Transaction "${title}" took ${duration}ms`);
    }
    return result;
  } catch (err) {
    const duration = Date.now() - start;
    globalContext.logger.error(`Transaction "${title}" failed after ${duration}ms`, err);
    throw err;
  }
}

/**
 * Check if currently running within a transaction context
 */
export function isInTransaction(): boolean {
  return !!transactionStorage.getStore();
}

/**
 * Run the request handler within a transaction (for non-GET requests)
 */
export async function runRequestInTransaction<T>(
  callback: () => Promise<T>
): Promise<T> {
  const globalContext = getGlobalContext();
  const requestContext = getRequestContext();
  
  return globalContext.db.transaction(async (txDb) => {
    // Create new context store with transaction DB
    const transactionContext: TransactionContextStore = {
      global: globalContext,
      request: requestContext,
      transactionDb: txDb,
    };
    
    // Run the entire request within the transaction context
    return transactionStorage.run(transactionContext, callback);
  });
}