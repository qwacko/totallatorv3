import { eq } from 'drizzle-orm';
import { type DBType } from '../../db';
import { keyValueTable } from '../../postgres/schema';

export const keyValueStore = (key: string) => {
	return {
		get: async (db: DBType) => {
			const keyValue = await db
				.select({ value: keyValueTable.value })
				.from(keyValueTable)
				.where(eq(keyValueTable.key, key))
				.limit(1)
				.execute();

			if (keyValue?.length > 0) {
				return keyValue[0].value;
			}
			return undefined;
		},
		set: async (db: DBType, value: string) => {
			await db
				.insert(keyValueTable)
				.values({
					key,
					value
				})
				.onConflictDoUpdate({ target: keyValueTable.key, set: { value } })
				.execute();
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
		}
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
		}
	};
};
