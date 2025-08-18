import type { TransactionType } from '@totallator/database';
import { getGlobalContext, getRequestContext, contextStorage, transactionStorage, type TransactionContextStore } from './asyncStorage.js';

/**
 * Run a function within a database transaction, preserving async context.
 * 
 * This is a low-level function that creates a transaction context but doesn't
 * include logging. For most use cases, prefer runInTransactionWithLogging.
 * 
 * @param callback Function to execute within transaction
 * @returns Result of callback function
 */
async function runInTransaction<T>(
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
 * Run a function within a database transaction with comprehensive logging.
 * 
 * This is the recommended way to run database transactions. It provides:
 * - Automatic transaction context management
 * - Performance timing and logging
 * - Error logging with timing information
 * - Configurable logging thresholds
 * 
 * @param title Descriptive name for the transaction (used in logs)
 * @param callback Function to execute within transaction  
 * @returns Result of callback function
 * @throws Re-throws any error from the callback with additional logging
 */
export async function runInTransactionWithLogging<T>(
  title: string,
  callback: (txDb: TransactionType) => Promise<T>
): Promise<T> {
  const globalContext = getGlobalContext();
  const enableTransactionLogging = globalContext.serverEnv.TRANSACTIONLOG_ENABLE;
  const enableTransactionStartLogging = globalContext.serverEnv.TRANSACTIONLOG_ENABLESTART;
  const transactionLoggingThreshold = globalContext.serverEnv.TRANSACTIONLOG_TIME_MS;
  
  // If logging is disabled, run without timing overhead
  if (!enableTransactionLogging) {
    return runInTransaction(callback);
  }
  
  const start = Date.now();
  if (enableTransactionStartLogging) {
    globalContext.logger("database").info({
      code: 'TXN_001',
      title: `Transaction "${title}" started`
    });
  }
  
  try {
    const result = await runInTransaction(callback);
    const duration = Date.now() - start;
    if (duration > transactionLoggingThreshold) {
      globalContext.logger("database").info({
        code: 'TXN_002',
        title: `Transaction "${title}" took ${duration}ms`,
        duration,
        transactionTitle: title
      });
    }
    return result;
  } catch (err) {
    const duration = Date.now() - start;
    globalContext.logger("database").error({
      code: 'TXN_003',
      title: `Transaction "${title}" failed after ${duration}ms`,
      duration,
      transactionTitle: title,
      error: err
    });
    throw err;
  }
}


/**
 * Run an entire request handler within a database transaction.
 * 
 * This is used for non-GET requests where the entire request should be
 * wrapped in a transaction. The callback runs within transaction context
 * so all database operations will use the transaction automatically.
 * 
 * @param callback Request handler function to execute
 * @returns Result of callback function
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