import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../postgres/schema';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { serverEnv } from '../../serverEnv';
import { type Logger } from 'drizzle-orm';
import type { DBType } from '../db';
import { seedTestAccounts } from './seedTestAccounts';
import { seedTestBills } from './seedTestBills';
import { seedTestBudgets } from './seedTestBudgets';
import { seedTestCategories } from './seedTestCategories';
import { seedTestLabels } from './seedTestLabels';
import { seedTestTags } from './seedTestTags';
import postgres from 'postgres';
import { it } from 'vitest';
import { nanoid } from 'nanoid';

if (!serverEnv.POSTGRES_TEST_URL) {
	throw new Error('POSTGRES_TEST_URL is not defined');
}

const genTestDB = async () => {
	const useURL = serverEnv.POSTGRES_TEST_URL || serverEnv.POSTGRES_URL || '';

	const enableLogger = serverEnv.DB_QUERY_LOG;

	class MyLogger implements Logger {
		logQuery(query: string, params: unknown[]): void {
			// console.log({ query, params });
			if (query.startsWith('update') && enableLogger && serverEnv.DEV) {
				console.log({ query, params });
			}
		}
	}

	const postgresDatabase = postgres(useURL, { max: 10 });

	const testDB = drizzle(postgresDatabase, { schema, logger: new MyLogger() });

	await migrate(testDB, { migrationsFolder: './src/lib/server/db/postgres/migrations' });

	return { testDB, postgresDatabase };
};

const testDBPromise = genTestDB();

export const getTestDB = async () => {
	return await testDBPromise;
};

export const closeTestDB = async (data: Awaited<ReturnType<typeof getTestDB>>) => {
	// await data.postgresDatabase.end();
};

export const clearTestDB = async (db: DBType) => {
	await db.delete(schema.account).execute();
	await db.delete(schema.tag).execute();
	await db.delete(schema.bill).execute();
	await db.delete(schema.budget).execute();
	await db.delete(schema.category).execute();
	await db.delete(schema.label).execute();
	await db.delete(schema.labelsToJournals).execute();
	await db.delete(schema.importItemDetail).execute();
	await db.delete(schema.importMapping).execute();
	await db.delete(schema.importTable).execute();
	await db.delete(schema.journalEntry).execute();
	await db.delete(schema.transaction).execute();
	await db.delete(schema.reusableFilter).execute();
	await db.delete(schema.summaryTable).execute();
};

export const initialiseTestDB = async ({
	db,
	id,
	accounts = false,
	bills = false,
	budgets = false,
	categories = false,
	labels = false,
	transactions = false,
	tags = false
}: {
	db: DBType;
	id: string;
	accounts?: boolean;
	bills?: boolean;
	budgets?: boolean;
	categories?: boolean;
	labels?: boolean;
	transactions?: boolean;
	tags?: boolean;
}) => {
	let itemCount = 0;

	if (accounts) {
		await seedTestAccounts(db, id);
	}
	if (bills) {
		await seedTestBills(db);
	}
	if (budgets) {
		await seedTestBudgets(db);
	}
	if (categories) {
		await seedTestCategories(db);
	}
	if (labels) {
		await seedTestLabels(db);
	}
	if (transactions) {
		itemCount++;
	}
	if (tags) {
		await seedTestTags(db);
	}
	return itemCount;
};

export const createTestWrapper = async ({
	beforeEach,
	afterEach,
	db
}: {
	beforeEach?: (db: DBType, id: string) => Promise<void>;
	afterEach?: (db: DBType, id: string) => Promise<void>;
	db: DBType;
}) => {
	return (name: string, testFunction: (db: DBType, id: string) => Promise<void>) => {
		it(name, async () => {
			const id = nanoid();

			// expect("this").toEqual("That")
			if (beforeEach) await beforeEach(db, id);
			await testFunction(db, id);
			if (afterEach) await afterEach(db, id);
		});
	};
};
