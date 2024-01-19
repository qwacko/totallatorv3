import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { keyValueTable } from '../../postgres/schema';

export const keyValueStore = (key: string) => {
	return {
		get: async () => {
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
		set: async (value: string) => {
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
		get: async () => {
			const value = await store.get();

			if (value === undefined) {
				return defaultValue;
			}

			return value === 'true';
		},
		set: async (value: boolean) => {
			await store.set(value ? 'true' : 'false');
		}
	};
};
