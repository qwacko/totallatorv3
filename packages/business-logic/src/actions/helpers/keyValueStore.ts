import { eq } from 'drizzle-orm';

import { type DBType } from '@totallator/database';
import { keyValueTable } from '@totallator/database';

import { dbExecuteLogger } from '@/server/db/dbLogger';

export const keyValueStore = (key: string) => {
	return {
		get: async (db: DBType) => {
			const keyValue = await dbExecuteLogger(
				db
					.select({ value: keyValueTable.value })
					.from(keyValueTable)
					.where(eq(keyValueTable.key, key))
					.limit(1),
				'Key Value Store - Get'
			);

			if (keyValue?.length > 0) {
				return keyValue[0].value;
			}
			return undefined;
		},
		set: async (db: DBType, value: string) => {
			await dbExecuteLogger(
				db
					.insert(keyValueTable)
					.values({
						key,
						value
					})
					.onConflictDoUpdate({ target: keyValueTable.key, set: { value } }),
				'Key Value Store - Set'
			);
		},
		clear: async (db: DBType) => {
			await dbExecuteLogger(
				db.delete(keyValueTable).where(eq(keyValueTable.key, key)),
				'Key Value Store - Reset'
			);
		}
	};
};

export const booleanKeyValueStore = (key: string, defaultValue: boolean = false) => {
	const store = keyValueStore(key);

	return {
		get: async (db: DBType) => {
			const value = await store.get(db);

			if (value === undefined) {
				return defaultValue;
			}

			return value === 'true';
		},
		set: async (db: DBType, value: boolean) => {
			await store.set(db, value ? 'true' : 'false');
		},
		clear: store.clear
	};
};

export const enumKeyValueStore = <T extends string>(key: string, defaultValue: T) => {
	const store = keyValueStore(key);

	return {
		get: async (db: DBType) => {
			const value = await store.get(db);

			if (value === undefined) {
				return defaultValue;
			}

			return value as T;
		},
		set: async (db: DBType, value: T) => {
			await store.set(db, value);
		},
		clear: store.clear
	};
};

export const typedKeyValueStore = <T>(key: string, defaultValue: T) => {
	const store = keyValueStore(key);

	return {
		get: async (db: DBType) => {
			const value = await store.get(db);

			if (value === undefined) {
				return defaultValue;
			}

			return JSON.parse(value) as T;
		},
		set: async (db: DBType, value: T) => {
			await store.set(db, JSON.stringify(value));
		},
		clear: store.clear
	};
};
