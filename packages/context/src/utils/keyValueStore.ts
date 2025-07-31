import type { DBType } from '@totallator/database';
import type { Logger } from '@totallator/shared';

export interface KeyValueStoreOptions {
  db: DBType;
  logger?: Logger;
}

export interface KeyValueStore {
  get: (key: string) => Promise<string | undefined>;
  set: (key: string, value: string) => Promise<void>;
  delete: (key: string) => Promise<void>;
  exists: (key: string) => Promise<boolean>;
}

export interface BooleanKeyValueStore {
  get: (key: string, defaultValue?: boolean) => Promise<boolean>;
  set: (key: string, value: boolean) => Promise<void>;
  toggle: (key: string, defaultValue?: boolean) => Promise<boolean>;
}

export interface EnumKeyValueStore<T extends string> {
  get: (key: string, defaultValue: T) => Promise<T>;
  set: (key: string, value: T) => Promise<void>;
}

/**
 * Create a key-value store backed by the database
 * 
 * Note: This is a stub implementation. The actual implementation will be 
 * configured by the application using the business logic functions directly.
 */
export function createKeyValueStore(options: KeyValueStoreOptions): KeyValueStore {
  const { logger } = options;

  return {
    async get(key: string): Promise<string | undefined> {
      logger?.debug(`Key Value Store - Get stub called for key: ${key}`);
      return undefined;
    },

    async set(key: string, value: string): Promise<void> {
      logger?.debug(`Key Value Store - Set stub called for key: ${key}, value: ${value}`);
    },

    async delete(key: string): Promise<void> {
      logger?.debug(`Key Value Store - Delete stub called for key: ${key}`);
    },

    async exists(key: string): Promise<boolean> {
      logger?.debug(`Key Value Store - Exists stub called for key: ${key}`);
      return false;
    },
  };
}

/**
 * Create a boolean-specific key-value store
 */
export function createBooleanKeyValueStore(options: KeyValueStoreOptions): BooleanKeyValueStore {
  const { logger } = options;

  return {
    async get(key: string, defaultValue: boolean = false): Promise<boolean> {
      logger?.debug(`Boolean Key Value Store - Get stub called for key: ${key}, defaultValue: ${defaultValue}`);
      return defaultValue;
    },

    async set(key: string, value: boolean): Promise<void> {
      logger?.debug(`Boolean Key Value Store - Set stub called for key: ${key}, value: ${value}`);
    },

    async toggle(key: string, defaultValue: boolean = false): Promise<boolean> {
      const currentValue = await this.get(key, defaultValue);
      const newValue = !currentValue;
      await this.set(key, newValue);
      return newValue;
    },
  };
}

/**
 * Create an enum-specific key-value store
 */
export function createEnumKeyValueStore<T extends string>(
  options: KeyValueStoreOptions
): EnumKeyValueStore<T> {
  const { logger } = options;

  return {
    async get(key: string, defaultValue: T): Promise<T> {
      logger?.debug(`Enum Key Value Store - Get stub called for key: ${key}, defaultValue: ${defaultValue}`);
      return defaultValue;
    },

    async set(key: string, value: T): Promise<void> {
      logger?.debug(`Enum Key Value Store - Set stub called for key: ${key}, value: ${value}`);
    },
  };
}