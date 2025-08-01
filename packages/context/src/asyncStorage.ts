import { AsyncLocalStorage } from 'node:async_hooks';
import type { GlobalContext } from './global.js';
import type { RequestContext } from './request.js';

export interface ContextStore {
  global: GlobalContext;
  request: RequestContext;
}

export const contextStorage = new AsyncLocalStorage<ContextStore>();

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

export function getContextDB() {
  const context = getGlobalContext();
  if (!context.db) {
    throw new Error('Database not initialized in the global context.');
  }
  return context.db;
}

export function runWithContext<T>(
  global: GlobalContext,
  request: RequestContext,
  callback: () => T
): T {
  return contextStorage.run({ global, request }, callback);
}