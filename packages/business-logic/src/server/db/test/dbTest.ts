import { type Logger } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';
import { it } from 'vitest';

import { getContextDB, hookBuilder, type GlobalContext } from '@totallator/context';
import * as schema from '@totallator/database';
import { createPGliteTestDatabase, type DBType } from '@totallator/database';
import { serverEnvSchema } from '@totallator/shared';

import {
	materializedViewActions,
	runWithMaterializedViewTestContext
} from '@totallator/business-logic/actions/materializedViewActions';
import { getLogger } from '@totallator/business-logic/logger';

import { seedTestAccounts } from './seedTestAccounts';
import { seedTestBills } from './seedTestBills';
import { seedTestBudgets } from './seedTestBudgets';
import { seedTestCategories } from './seedTestCategories';
import { seedTestLabels } from './seedTestLabels';
import { seedTestTags } from './seedTestTags';
import { seedTestImports } from './seedTestImports';
import { seedTestTransactions } from './seedTestTransactions';
import { expandDate } from '../../../actions/helpers/journal/expandDate';
import { updatedTime } from '../../../actions/helpers/misc/updatedTime';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsPath = path.resolve(__dirname, '../../../../../database/src/test-migrations');

type TestDbConnection = {
	testDB: DBType;
	postgresDatabase: { close: () => Promise<void> };
};

const createTestServerEnv = () =>
	serverEnvSchema.parse({
	TEST_ENV: 'true',
	CONCURRENT_REFRESH: 'false',
	DB_QUERY_LOG: 'false',
	DEV: false
	});

const createStructuredLogger = () => ({
	error: () => {},
	warn: () => {},
	info: () => {},
	debug: () => {},
	trace: () => {},
	pino: console as never
});

const noopLoggerFactory = Object.assign(
	() => createStructuredLogger(),
	{ pino: console as never }
) as unknown as GlobalContext['logger'];

const testGlobalContext: GlobalContext = {
	contextId: 'test-context',
	logging: {
		queryLoggedItems: async () => [],
		getLoggedItemsCount: async () => 0,
		getAllLogConfigurations: async () => [],
		setLogLevel: async () => {},
		deleteOldLogs: async () => 0
	},
	logger: noopLoggerFactory,
	db: undefined as never,
	serverEnv: createTestServerEnv(),
	postgresDatabase: undefined,
	viewRefreshLimiter: {
		updateLastRequest: () => {},
		tryAcquire: async () => true,
		getStatus: () => ({ activeCount: 0, queuedCount: 0, isLocked: false }),
		on: () => {},
		off: () => {},
		removeAllListeners: () => {}
	} as never,
	createRateLimiter: (() => {
		throw new Error('Not implemented in test context');
	}) as never,
	eventEmitter: {
		on: () => {},
		once: () => {},
		off: () => {},
		emit: () => true,
		removeAllListeners: () => {},
		listenerCount: () => 0
	} as never
};

const { standaloneContext } = hookBuilder({
	initGlobalContext: async () => testGlobalContext,
	createRequestContext: () =>
		({
			requestId: nanoid(),
			startTime: Date.now(),
			routeId: 'test',
			url: '/test',
			method: 'TEST',
			ip: '127.0.0.1'
		}) as never
});

export const withTestDbContext = async <T>(db: DBType, callback: () => Promise<T>) =>
	await standaloneContext({} as never, async () => {
		testGlobalContext.db = db;
		testGlobalContext.serverEnv = createTestServerEnv();

		return await runWithMaterializedViewTestContext({
			db,
			serverEnv: createTestServerEnv(),
			callback
		});
	});

const runWithExistingOrNewTestContext = async <T>(db: DBType, callback: () => Promise<T>) => {
	try {
		if (getContextDB() === db) {
			return await callback();
		}
	} catch {
		// No active context; create one for the callback.
	}

	return await withTestDbContext(db, callback);
};

const bindTransactionsToTestContext = (db: DBType): DBType => {
	const transactionDb = db as any;
	const originalTransaction = transactionDb.transaction.bind(transactionDb);

	transactionDb.transaction = (async <T>(callback: (txDb: DBType) => Promise<T>) =>
		await originalTransaction(async (txDb: DBType) => {
			const previousDb = testGlobalContext.db;
			testGlobalContext.db = txDb;

			try {
				return await callback(txDb);
			} finally {
				testGlobalContext.db = previousDb;
			}
		})) as typeof transactionDb.transaction;

	return transactionDb;
};

const genTestDB = async () => {
	const enableLogger = false;

	class MyLogger implements Logger {
		logQuery(query: string, params: unknown[]): void {
			if (query.startsWith('update') && enableLogger) {
				getLogger('database').info({
					code: 'DB_TEST_002',
					title: 'Database query logged',
					query,
					params
				});
			}
		}
	}

	const { db: rawTestDB, client: postgresDatabase } = await createPGliteTestDatabase({
		migrationsPath,
		dataDir: `memory://totallator-test-${nanoid()}`,
		logger: new MyLogger()
	});
	const testDB = bindTransactionsToTestContext(rawTestDB as unknown as DBType);

	return {
		testDB: testDB as unknown as DBType,
		postgresDatabase
	} satisfies TestDbConnection;
};

export const getTestDB = async (): Promise<TestDbConnection> => {
	return await genTestDB();
};

export const closeTestDB = async (data: Awaited<ReturnType<typeof getTestDB>>) => {
	await data.postgresDatabase.close();
};

export const clearTestDB = async (db: DBType, { refreshViews = true }: { refreshViews?: boolean } = {}) => {
	await runWithExistingOrNewTestContext(db, async () => {
		await db.delete(schema.account).execute();
		await db.delete(schema.tag).execute();
		await db.delete(schema.bill).execute();
		await db.delete(schema.budget).execute();
		await db.delete(schema.category).execute();
		await db.delete(schema.label).execute();
		await db.delete(schema.agentRunEvent).execute();
		await db.delete(schema.journalLlmSuggestions).execute();
		await db.delete(schema.agentRun).execute();
		await db.delete(schema.llmSettings).execute();
		await db.delete(schema.labelsToJournals).execute();
		await db.delete(schema.importItemDetail).execute();
		await db.delete(schema.importMapping).execute();
		await db.delete(schema.importTable).execute();
		await db.delete(schema.journalEntry).execute();
		await db.delete(schema.transactionChange).execute();
		await db.delete(schema.transaction).execute();
		await db.delete(schema.reusableFilter).execute();
		if (refreshViews) {
			await materializedViewActions.refresh();
		}
		await materializedViewActions.setRefreshRequired();
	});
};

export const initialiseTestDB = async ({
	db,
	accounts = false,
	bills = false,
	budgets = false,
	categories = false,
	labels = false,
	transactions = false,
	tags = false,
	refreshViews = true
}: {
	db: DBType;
	accounts?: boolean;
	bills?: boolean;
	budgets?: boolean;
	categories?: boolean;
	labels?: boolean;
	transactions?: boolean;
	tags?: boolean;
	refreshViews?: boolean;
}) => {
	let itemCount = 0;

	if (accounts || bills || budgets || categories || labels || transactions || tags) {
		await seedTestImports(db);
	}

	if (accounts) {
		await seedTestAccounts(db);
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
		await seedTestTransactions(db);
		itemCount += 2;
	}
	if (tags) {
		await seedTestTags(db);
	}

	await runWithExistingOrNewTestContext(db, async () => {
		if (refreshViews) {
			await materializedViewActions.refresh();
		}
		await materializedViewActions.setRefreshRequired();
	});

	return itemCount;
};

export const createTestWrapper = async ({
	beforeEach,
	afterEach,
	getDB
}: {
	beforeEach?: (db: DBType, id: string) => Promise<void>;
	afterEach?: (db: DBType, id: string) => Promise<void>;
	getDB: () => DBType | undefined;
}) => {
	return (
		name: string,
		testFunction: (db: DBType, id: string) => Promise<void>,
		timeout?: number
	) => {
		it(
			name,
			async () => {
				const id = nanoid();
				const db = getDB();

				if (!db) {
					return;
				}

				await withTestDbContext(db, async () => {
					if (beforeEach) await beforeEach(db, id);
					await testFunction(db, id);
					if (afterEach) await afterEach(db, id);
				});
			},
			timeout
		);
	};
};

export const seedSimpleTransferJournal = async ({
	db,
	fromAccountId,
	toAccountId,
	amount,
	description,
	date
}: {
	db: DBType;
	fromAccountId: string;
	toAccountId: string;
	amount: number;
	description: string;
	date: string;
}) => {
	const transactionId = nanoid();
	const fromJournalId = nanoid();
	const toJournalId = nanoid();
	const expandedDate = expandDate(date);

	await db
		.insert(schema.transaction)
		.values({
			id: transactionId,
			...updatedTime()
		})
		.execute();

	await db
		.insert(schema.journalEntry)
		.values([
			{
				id: fromJournalId,
				transactionId,
				accountId: fromAccountId,
				amount: -1 * amount,
				description,
				linked: true,
				transfer: true,
				reconciled: false,
				dataChecked: false,
				complete: false,
				...expandedDate,
				...updatedTime()
			},
			{
				id: toJournalId,
				transactionId,
				accountId: toAccountId,
				amount,
				description,
				linked: true,
				transfer: true,
				reconciled: false,
				dataChecked: false,
				complete: false,
				...expandedDate,
				...updatedTime()
			}
		])
		.execute();

	return [fromJournalId, toJournalId];
};
