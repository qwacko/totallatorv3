import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { desc, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect } from 'vitest';

import { getContext } from '@totallator/context';
import { backupTable, transactionChange, type DBType } from '@totallator/database';

import {
	clearTestDB,
	closeTestDB,
	createTestWrapper,
	getTestDB
} from '@totallator/business-logic/server/db/test/dbTest';
import { seedTestAccounts } from '@totallator/business-logic/server/db/test/seedTestAccounts';
import { seedTestBills } from '@totallator/business-logic/server/db/test/seedTestBills';
import { seedTestBudgets } from '@totallator/business-logic/server/db/test/seedTestBudgets';
import { seedTestCategories } from '@totallator/business-logic/server/db/test/seedTestCategories';
import { seedTestImports } from '@totallator/business-logic/server/db/test/seedTestImports';
import { seedTestLabels } from '@totallator/business-logic/server/db/test/seedTestLabels';
import { seedTestTags } from '@totallator/business-logic/server/db/test/seedTestTags';
import { seedTestTransactions } from '@totallator/business-logic/server/db/test/seedTestTransactions';

import { backupActions } from './backupActions';
import { journalActions } from './journalActions';
import { journalMaterializedViewActions } from './journalMaterializedViewActions';
import { materializedViewActions } from './materializedViewActions';
import { reusableFilterActions } from './reusableFilterActions';

type SeededTransactions = Awaited<ReturnType<typeof seedTestTransactions>>;

describe('transaction change history', async () => {
	let dbConnection: Awaited<ReturnType<typeof getTestDB>> | undefined;
	let seededTransactions: SeededTransactions | undefined;
	let backupDir = '';

	beforeAll(async () => {
		dbConnection = await getTestDB();
		backupDir = await fs.mkdtemp(path.join(os.tmpdir(), 'totallator-backup-history-'));
	}, 30000);

	afterAll(async () => {
		if (dbConnection) {
			await closeTestDB(dbConnection);
			dbConnection = undefined;
		}

		if (backupDir) {
			await fs.rm(backupDir, { recursive: true, force: true });
		}
	});

	const testIt = await createTestWrapper({
		getDB: () => dbConnection?.testDB,
		beforeEach: async (db) => {
			await clearTestDB(db, { refreshViews: false });
			await seedTestImports(db);
			await seedTestAccounts(db);
			await seedTestBills(db);
			await seedTestBudgets(db);
			await seedTestCategories(db);
			await seedTestLabels(db);
			await seedTestTags(db);
			seededTransactions = await seedTestTransactions(db);
			await materializedViewActions.refresh();
			getContext().global.serverEnv.BACKUP_DIR = backupDir;
		}
	});

	const listHistory = async (db: DBType, transactionId: string) =>
		await db.query.transactionChange.findMany({
			where: eq(transactionChange.transactionId, transactionId),
			orderBy: [desc(transactionChange.createdAt)]
		});

	testIt('records manual journal updates with before and after snapshots', async (db) => {
		const seeded = seededTransactions;
		expect(seeded).toBeDefined();

		await journalActions.updateJournals({
			filter: {
				transactionIdArray: [seeded!.groceryTransactionId],
				page: 0,
				pageSize: 100
			},
			journalData: {
				description: 'Manual grocery update',
				tagTitle: 'Tag 2'
			}
		});

		const history = await listHistory(db, seeded!.groceryTransactionId);
		expect(history).toHaveLength(1);
		expect(history[0]).toMatchObject({
			changeType: 'update',
			sourceType: 'system',
			sourceImportId: null,
			sourceFilterId: null
		});
		expect(history[0].changedFields).toEqual(expect.arrayContaining(['journals']));
		expect(history[0].beforeSnapshot?.journals[0]?.description).toBe('Seeded grocery purchase');
		expect(history[0].afterSnapshot?.journals[0]?.description).toBe('Manual grocery update');
	});

	testIt('records reusable filter updates with filter and import attribution', async (db) => {
		const seeded = seededTransactions;
		expect(seeded).toBeDefined();

		const reusableFilter = await reusableFilterActions.create({
			data: {
				title: 'Post Import Grocery Filter',
				filter: {
					transactionIdArray: [seeded!.groceryTransactionId]
				},
				change: {
					description: 'Reusable filter change',
					categoryTitle: 'Food:Restaurants'
				}
			}
		});

		await reusableFilterActions.applyById({
			id: reusableFilter.id,
			importId: 'ImportTransaction1'
		});

		const history = await listHistory(db, seeded!.groceryTransactionId);
		expect(history).toHaveLength(1);
		expect(history[0]).toMatchObject({
			changeType: 'update',
			sourceType: 'filter',
			sourceImportId: 'ImportTransaction1',
			sourceFilterId: reusableFilter.id,
			sourceFilterTitle: 'Post Import Grocery Filter'
		});
		expect(history[0].summary).toContain('reusable filter');
		expect(history[0].afterSnapshot?.journals[0]?.description).toBe('Reusable filter change');
	});

	testIt('records creation imports as import-linked transaction changes', async (db) => {
		await journalActions.createManyTransactionJournals({
			journalEntries: [
				[
					{
						date: '2026-03-12',
						description: 'Imported transaction',
						amount: -15,
						accountId: 'Account1',
						importId: 'ImportTransaction1',
						importDetailId: 'ImportDetailTransaction1'
					},
					{
						date: '2026-03-12',
						description: 'Imported transaction',
						amount: 15,
						accountId: 'Account4',
						importId: 'ImportTransaction1',
						importDetailId: 'ImportDetailTransaction1'
					}
				]
			],
			isImport: true,
			auditSource: {
				sourceType: 'import',
				importId: 'ImportTransaction1',
				importDetailId: 'ImportDetailTransaction1',
				summary: 'Created from import'
			}
		});

		const history = await db.query.transactionChange.findMany({
			where: eq(transactionChange.sourceImportId, 'ImportTransaction1'),
			orderBy: [desc(transactionChange.createdAt)]
		});

		expect(history.some((item) => item.changeType === 'create')).toBe(true);
		expect(history.some((item) => item.summary === 'Created from import')).toBe(true);
	});

	testIt('filters journals by import id using both created and updated import associations', async () => {
		const seeded = seededTransactions;
		expect(seeded).toBeDefined();

		const reusableFilter = await reusableFilterActions.create({
			data: {
				title: 'Import Link Filter',
				filter: {
					transactionIdArray: [seeded!.groceryTransactionId]
				},
				change: {
					description: 'Import-linked update'
				}
			}
		});

		await reusableFilterActions.applyById({
			id: reusableFilter.id,
			importId: 'ImportTransaction1'
		});

		const results = await journalMaterializedViewActions.list({
			filter: {
				importIdArray: ['ImportTransaction1'],
				page: 0,
				pageSize: 100
			}
		});

		expect(results.data.some((item) => item.transactionId === seeded!.groceryTransactionId)).toBe(true);
		expect(results.data.some((item) => item.description === 'Import-linked update')).toBe(true);
	});

	testIt(
		'includes transaction change rows in backup and restore',
		async (db) => {
			const seeded = seededTransactions;
			expect(seeded).toBeDefined();

			const reusableFilter = await reusableFilterActions.create({
				data: {
					title: 'Backup Filter',
					filter: {
						transactionIdArray: [seeded!.groceryTransactionId]
					},
					change: {
						description: 'Backup filter description'
					}
				}
			});

			await reusableFilterActions.applyById({
				id: reusableFilter.id,
				importId: 'ImportTransaction1'
			});

			const beforeBackupHistory = await listHistory(db, seeded!.groceryTransactionId);
			expect(beforeBackupHistory).toHaveLength(1);

			await backupActions.storeBackup({
				title: 'Transaction History Backup',
				compress: true,
				createdBy: 'Test',
				creationReason: 'Manual'
			});

			const storedBackup = await db.query.backupTable.findFirst({
				orderBy: [desc(backupTable.createdAt)]
			});
			expect(storedBackup?.information.information.itemCount.numberTransactionChanges).toBe(1);

			await db.delete(transactionChange).execute();
			expect(await listHistory(db, seeded!.groceryTransactionId)).toHaveLength(0);

			await backupActions.restoreBackup({
				id: storedBackup!.id,
				includeUsers: false
			});

			const restoredHistory = await listHistory(db, seeded!.groceryTransactionId);
			expect(restoredHistory).toHaveLength(1);
			expect(restoredHistory[0]).toMatchObject({
				sourceType: 'filter',
				sourceImportId: 'ImportTransaction1',
				sourceFilterId: reusableFilter.id,
				sourceFilterTitle: 'Backup Filter'
			});
			expect(restoredHistory[0].afterSnapshot?.journals[0]?.description).toBe(
				'Backup filter description'
			);
		},
		20000
	);
});
