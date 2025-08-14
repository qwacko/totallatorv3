import { AsyncLocalStorage } from 'node:async_hooks';
import type { GlobalContext } from './global.js';
import type { RequestContext } from './request.js';
import type { TransactionType } from '@totallator/database';
import type { TypedEventEmitter } from './eventEmitter.js';

/**
 * Standard context store containing global and request-scoped context.
 * This is the primary context used throughout the application.
 */
export interface ContextStore {
  /** Global application context */
  global: GlobalContext;
  
  /** Request-scoped context */
  request: RequestContext;
}

/**
 * Extended context store that includes transaction database.
 * Used when running operations within database transactions.
 */
export interface TransactionContextStore extends ContextStore {
  /** Transaction-scoped database connection */
  transactionDb: TransactionType;
}

// AsyncLocalStorage instances for context management
export const contextStorage = new AsyncLocalStorage<ContextStore>();
export const transactionStorage = new AsyncLocalStorage<TransactionContextStore>();

/**
 * Get the global context from AsyncLocalStorage.
 * 
 * This provides access to global application resources like database and logger
 * from anywhere within the request processing chain.
 * 
 * @returns Global application context
 * @throws Error if called outside of context scope
 */
export function getGlobalContext(): GlobalContext {
  const store = contextStorage.getStore();
  if (!store) {
    throw new Error('Global context not available. Make sure the request is running within the AsyncLocalStorage context.');
  }
  return store.global;
}

/**
 * Get the request context from AsyncLocalStorage.
 * 
 * This provides access to request-scoped data like user authentication
 * and request metadata from anywhere within the request processing chain.
 * 
 * @returns Request context
 * @throws Error if called outside of context scope
 */
export function getRequestContext(): RequestContext {
  const store = contextStorage.getStore();
  if (!store) {
    throw new Error('Request context not available. Make sure the request is running within the AsyncLocalStorage context.');
  }
  return store.request;
}

/**
 * Get the complete context store from AsyncLocalStorage.
 * 
 * Provides access to both global and request-scoped context.
 * 
 * @returns Complete context store
 * @throws Error if called outside of context scope
 */
export function getContext(): ContextStore {
  const store = contextStorage.getStore();
  if (!store) {
    throw new Error('Context store not available. Make sure the request is running within the AsyncLocalStorage context.');
  }
  return store;
}

/**
 * Get the database connection, preferring transaction DB if available.
 * 
 * This is the primary database access function used throughout the application.
 * It automatically returns the transaction database if currently running within
 * a transaction, otherwise returns the regular database connection.
 * 
 * @returns Database connection (transaction or regular)
 * @throws Error if called outside of context scope
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

/**
 * Get the event emitter from AsyncLocalStorage.
 * 
 * This provides access to the type-safe event emitter from anywhere within
 * the request processing chain for asynchronous event handling.
 * 
 * @returns Type-safe event emitter
 * @throws Error if called outside of context scope
 */
export function getContextEventEmitter(): TypedEventEmitter {
  const store = contextStorage.getStore();
  if (!store) {
    throw new Error('Event emitter context not available. Make sure the request is running within the AsyncLocalStorage context.');
  }
  return store.global.eventEmitter;
}

/**
 * Run a function within the AsyncLocalStorage context.
 * 
 * This establishes the context for a request, making global and request-scoped
 * data available to all functions called within the callback.
 * 
 * @param global Global application context
 * @param request Request-scoped context
 * @param callback Function to execute within context
 * @returns Result of callback function
 */
export function runWithContext<T>(
  global: GlobalContext,
  request: RequestContext,
  callback: () => T
): T {
  return contextStorage.run({ global, request }, callback);
}