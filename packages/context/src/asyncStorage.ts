import { AsyncLocalStorage } from 'node:async_hooks';
import type { GlobalContext } from './global.js';
import type { RequestContext } from './request.js';
import type { TransactionType } from '@totallator/database';

export interface ContextStore {
  global: GlobalContext;
  request: RequestContext;
}

/**
 * Extended context store that includes transaction database
 */
export interface TransactionContextStore extends ContextStore {
  transactionDb: TransactionType;
}

export const contextStorage = new AsyncLocalStorage<ContextStore>();
export const transactionStorage = new AsyncLocalStorage<TransactionContextStore>();

export function getGlobalContext(): GlobalContext {
  const store = contextStorage.getStore();
  if (!store) {
    throw new Error('Global context not available. Make sure the request is running within the AsyncLocalStorage context.');
  }
  return store.global;
}

export function getRequestContext(): RequestContext {
  const store = contextStorage.getStore();
  if (!store) {
    throw new Error('Request context not available. Make sure the request is running within the AsyncLocalStorage context.');
  }
  return store.request;
}

export function getContext(): ContextStore {
  const store = contextStorage.getStore();
  if (!store) {
    throw new Error('Context store not available. Make sure the request is running within the AsyncLocalStorage context.');
  }
  return store;
}

/**
 * Get the database, preferring transaction DB if available
 * This is now the unified database access function
 */
export function getContextDB() {
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

export function runWithContext<T>(
  global: GlobalContext,
  request: RequestContext,
  callback: () => T
): T {
  return contextStorage.run({ global, request }, callback);
}