import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { eq } from 'drizzle-orm';
import Papa from 'papaparse';
import { nanoid } from 'nanoid';
import { afterAll, beforeAll, describe, expect } from 'vitest';

import { getContext } from '@totallator/context';
import {
	importTable,
	journalEntry,
	labelsToJournals,
	transactionChange,
	type DBType
} from '@totallator/database';

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
import { updatedTime } from '@totallator/business-logic/actions/helpers/misc/updatedTime';

import { importActions } from './importActions';
import { journalMaterializedViewActions } from './journalMaterializedViewActions';
import { materializedViewActions } from './materializedViewActions';

type SeededTransactions = Awaited<ReturnType<typeof seedTestTransactions>>;

const createImportFile = (rows: Record<string, string | number | boolean>[]) =>
	new File([Papa.unparse(rows)], 'journal-update.csv', { type: 'text/csv' });

const createImportFileFromCsv = (csv: string) =>
	new File([csv], 'journal-update.csv', { type: 'text/csv' });

const getTransactionJournals = async (db: DBType, transactionId: string) =>
	await db.query.journalEntry.findMany({
		where: (journalEntry, { eq }) => eq(journalEntry.transactionId, transactionId),
		with: {
			account: true,
			bill: true,
			budget: true,
			category: true,
			tag: true,
			labels: {
				with: {
					label: true
				}
			}
		}
	});

describe('importActions journalUpdate CSV coverage', async () => {
	let dbConnection: Awaited<ReturnType<typeof getTestDB>> | undefined;
	let seededTransactions: SeededTransactions | undefined;
	let importDir = '';

	beforeAll(async () => {
		dbConnection = await getTestDB();
		importDir = await fs.mkdtemp(path.join(os.tmpdir(), 'totallator-journal-update-import-'));
	}, 30000);

	afterAll(async () => {
		if (dbConnection) {
			await closeTestDB(dbConnection);
			dbConnection = undefined;
		}

		if (importDir) {
			await fs.rm(importDir, { recursive: true, force: true });
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
			getContext().global.serverEnv.IMPORT_DIR = importDir;
		}
	});

	const runJournalUpdateImport = async (db: DBType, rows: Record<string, string | number | boolean>[]) => {
		return await runJournalUpdateImportFile(db, createImportFile(rows));
	};

	const runJournalUpdateImportFile = async (db: DBType, file: File) => {
		const result = await importActions.runImportLifecycle({
			data: {
				importType: 'journalUpdate',
				autoProcess: true,
				autoClean: false,
				checkImportedOnly: false,
				file
			}
		});

		const importInfo = await db.query.importTable.findFirst({
			where: eq(importTable.id, result.importId),
			with: {
				importDetails: true
			}
		});

		expect(result.status).toBe('complete');
		expect(importInfo?.status).toBe('complete');

		return {
			importId: result.importId,
			importInfo
		};
	};

	testIt(
		'applies linked journal updates from a CSV file including labels, dates, amounts, account changes, and clears',
		async (db) => {
			const seeded = seededTransactions;
			expect(seeded).toBeDefined();

			const { importInfo } = await runJournalUpdateImport(db, [
				{
					id: seeded!.groceryExpenseId,
					date: '2024-04-20',
					description: 'Updated grocery import',
					amount: 120.55,
					accountTitle: 'Shop 2',
					otherAccountTitle: 'Cash:Bank',
					categoryTitle: 'Food:Restaurants',
					tagClear: true,
					billClear: true,
					budgetClear: true,
					labelTitles: 'Label 2',
					removeLabels: 'Label7',
					setComplete: true
				}
			]);

				expect(importInfo?.importDetails).toHaveLength(1);
				expect(importInfo?.importDetails[0]).toMatchObject({
					status: 'imported',
					relationId: seeded!.groceryExpenseId
				});

				const history = await db.query.transactionChange.findMany({
					where: eq(transactionChange.transactionId, seeded!.groceryTransactionId)
				});
				expect(history).toHaveLength(1);
				expect(history[0]).toMatchObject({
					changeType: 'update',
					sourceType: 'import',
					sourceImportId: importInfo?.id,
					sourceImportDetailId: importInfo?.importDetails[0]?.id
				});

				const journals = await getTransactionJournals(db, seeded!.groceryTransactionId);
			expect(journals).toHaveLength(2);

			const expenseJournal = journals.find((journal) => journal.id === seeded!.groceryExpenseId);
			const cashJournal = journals.find((journal) => journal.id === seeded!.groceryCashId);

			expect(expenseJournal).toMatchObject({
				description: 'Updated grocery import',
				dateText: '2024-04-20',
				amount: 120.55,
				accountId: 'Account5',
				categoryId: 'Category4',
				tagId: null,
				billId: null,
				budgetId: null,
				complete: true,
				reconciled: true,
				dataChecked: true
			});
			expect(expenseJournal?.account?.accountTitleCombined).toBe('Shop 2');
			expect(expenseJournal?.category?.title).toBe('Food:Restaurants');
			expect(expenseJournal?.labels.map((item) => item.label?.title).sort()).toEqual(['Label 2']);

			expect(cashJournal).toMatchObject({
				description: 'Updated grocery import',
				dateText: '2024-04-20',
				amount: -120.55,
				accountId: 'Account2',
				tagId: null,
				billId: null,
				budgetId: null,
				complete: true,
				reconciled: true,
				dataChecked: true
			});
			expect(cashJournal?.account?.accountTitleCombined).toBe('Cash:Bank');
			expect(cashJournal?.labels.map((item) => item.label?.title).sort()).toEqual(['Label 2']);
		}
	);

	testIt('allows label-only CSV updates on complete journals', async (db) => {
		const seeded = seededTransactions;
		expect(seeded).toBeDefined();

		const { importInfo } = await runJournalUpdateImport(db, [
			{
				id: seeded!.transferOutId,
				addLabelTitles: 'Label 2'
			}
		]);

		expect(importInfo?.importDetails[0]?.status).toBe('imported');

		const journals = await getTransactionJournals(db, seeded!.transferTransactionId);
		expect(journals).toHaveLength(2);

		for (const journal of journals) {
			expect(journal.complete).toBe(true);
			expect(journal.labels.map((item) => item.label?.title)).toEqual(['Label 2']);
		}
	});

	testIt('marks non-label CSV updates to complete journals as import errors without mutating the journals', async (db) => {
		const seeded = seededTransactions;
		expect(seeded).toBeDefined();

		const { importInfo } = await runJournalUpdateImport(db, [
			{
				id: seeded!.transferOutId,
				amount: -175
			}
		]);

		expect(importInfo?.importDetails).toHaveLength(1);
		expect(importInfo?.importDetails[0]?.status).toBe('importError');
		expect(importInfo?.importDetails[0]?.errorInfo?.errors?.[0]).toContain('could not be applied');

		const journals = await getTransactionJournals(db, seeded!.transferTransactionId);
		const transferOutJournal = journals.find((journal) => journal.id === seeded!.transferOutId);
		const transferInJournal = journals.find((journal) => journal.id === seeded!.transferInId);

		expect(transferOutJournal?.amount).toBe(-150);
		expect(transferInJournal?.amount).toBe(150);
		expect(transferOutJournal?.labels).toHaveLength(0);
		expect(transferInJournal?.labels).toHaveLength(0);
	});

	testIt('supports additive label updates without replacing existing labels', async (db) => {
		const seeded = seededTransactions;
		expect(seeded).toBeDefined();

		const { importInfo } = await runJournalUpdateImport(db, [
			{
				id: seeded!.groceryExpenseId,
				addLabelTitles: 'Label 2, Label 3'
			}
		]);

		expect(importInfo?.importDetails[0]?.status).toBe('imported');

		const journals = await getTransactionJournals(db, seeded!.groceryTransactionId);
		const expenseJournal = journals.find((journal) => journal.id === seeded!.groceryExpenseId);
		const cashJournal = journals.find((journal) => journal.id === seeded!.groceryCashId);

		expect(expenseJournal?.labels.map((item) => item.label?.title).sort()).toEqual([
			'Imported Label',
			'Label 1',
			'Label 2',
			'Label 3'
		]);
		expect(cashJournal?.labels.map((item) => item.label?.title).sort()).toEqual(['Label 2', 'Label 3']);
	});

	testIt('accepts boolean-like CSV values for clear and set flags', async (db) => {
		const seeded = seededTransactions;
		expect(seeded).toBeDefined();

		const { importInfo } = await runJournalUpdateImport(db, [
			{
				id: seeded!.groceryExpenseId,
				tagClear: 'YES',
				billClear: '1',
				budgetClear: 'true',
				setComplete: 'on'
			}
		]);

		expect(importInfo?.importDetails[0]?.status).toBe('imported');

		const journals = await getTransactionJournals(db, seeded!.groceryTransactionId);
		const expenseJournal = journals.find((journal) => journal.id === seeded!.groceryExpenseId);
		const cashJournal = journals.find((journal) => journal.id === seeded!.groceryCashId);

		expect(expenseJournal).toMatchObject({
			tagId: null,
			billId: null,
			budgetId: null,
			complete: true,
			reconciled: true,
			dataChecked: true
		});
		expect(cashJournal).toMatchObject({
			tagId: null,
			billId: null,
			budgetId: null,
			complete: true,
			reconciled: true,
			dataChecked: true
		});
	});

	testIt('marks duplicate and invalid rows while still importing valid rows from the same CSV file', async (db) => {
		const seeded = seededTransactions;
		expect(seeded).toBeDefined();

		const { importInfo } = await runJournalUpdateImport(db, [
			{
				id: seeded!.groceryExpenseId,
				description: 'Mixed row success'
			},
			{
				id: seeded!.groceryExpenseId,
				description: 'Duplicate row should not run'
			},
			{
				description: 'Missing id should fail validation'
			}
		]);

		expect(importInfo?.importDetails).toHaveLength(3);

		const importedDetail = importInfo?.importDetails.find((detail) => detail.status === 'imported');
		const duplicateDetail = importInfo?.importDetails.find((detail) => detail.status === 'duplicate');
		const errorDetail = importInfo?.importDetails.find((detail) => detail.status === 'importError');
		expect(importedDetail).toBeDefined();
		expect(duplicateDetail).toBeDefined();
		expect(errorDetail).toBeDefined();

		expect(duplicateDetail?.uniqueId).toBe(`id:${seeded!.groceryExpenseId}`);
		expect(errorDetail?.errorInfo?.errors?.join(' ')).toContain('could not be applied');

		const journals = await getTransactionJournals(db, seeded!.groceryTransactionId);
		const expenseJournal = journals.find((journal) => journal.id === seeded!.groceryExpenseId);
		const cashJournal = journals.find((journal) => journal.id === seeded!.groceryCashId);

		expect(expenseJournal?.description).toBe('Mixed row success');
		expect(cashJournal?.description).not.toBe('Duplicate row should not run');
		expect(cashJournal?.dateText).toBe('2024-03-16');
	});

	testIt('round-trips generated journal update CSV through the import lifecycle', async (db) => {
		const seeded = seededTransactions;
		expect(seeded).toBeDefined();

		const exportedCsv = await journalMaterializedViewActions.generateCSVData({
			filter: {
				idArray: [seeded!.groceryExpenseId],
				account: { type: ['asset', 'liability', 'expense', 'income'] }
			},
			returnType: 'journalUpdate'
		});

		const parsedCsv = Papa.parse<Record<string, string>>(exportedCsv, { header: true });
		expect(parsedCsv.errors).toEqual([]);
		expect(parsedCsv.data[0]?.id).toBe(seeded!.groceryExpenseId);

		parsedCsv.data[0] = {
			...parsedCsv.data[0],
			description: 'Round-tripped grocery update',
			labelTitles: 'Label 2',
			clearReconciled: 'true',
			setDataChecked: 'true',
			clearComplete: 'true'
		};

		const { importInfo } = await runJournalUpdateImportFile(
			db,
			createImportFileFromCsv(Papa.unparse(parsedCsv.data))
		);

		expect(importInfo?.importDetails[0]?.status).toBe('imported');

		const journals = await getTransactionJournals(db, seeded!.groceryTransactionId);
		const expenseJournal = journals.find((journal) => journal.id === seeded!.groceryExpenseId);
		const cashJournal = journals.find((journal) => journal.id === seeded!.groceryCashId);

		expect(expenseJournal).toMatchObject({
			description: 'Round-tripped grocery update',
			reconciled: false,
			dataChecked: true,
			complete: false
		});
		expect(expenseJournal?.labels.map((item) => item.label?.title).sort()).toEqual(['Label 2']);
		expect(cashJournal).toMatchObject({
			description: 'Round-tripped grocery update',
			reconciled: false,
			dataChecked: true,
			complete: false
		});
	});

	testIt(
		'does not re-resolve unchanged disabled linked items during import when other fields change',
		async (db) => {
			const seeded = seededTransactions;
			expect(seeded).toBeDefined();

			await db
				.update(journalEntry)
				.set({
					tagId: 'Tag5',
					...updatedTime()
				})
				.where(eq(journalEntry.transactionId, seeded!.groceryTransactionId));

			await db.insert(labelsToJournals).values([
				{
					id: nanoid(),
					journalId: seeded!.groceryExpenseId,
					labelId: 'Label5',
					...updatedTime()
				},
				{
					id: nanoid(),
					journalId: seeded!.groceryCashId,
					labelId: 'Label5',
					...updatedTime()
				}
			]);

			await materializedViewActions.refresh();

			const exportedCsv = await journalMaterializedViewActions.generateCSVData({
				filter: {
					idArray: [seeded!.groceryExpenseId],
					account: { type: ['asset', 'liability', 'expense', 'income'] }
				},
				returnType: 'journalUpdate'
			});

			const parsedCsv = Papa.parse<Record<string, string>>(exportedCsv, { header: true });
			expect(parsedCsv.errors).toEqual([]);
			expect(parsedCsv.data[0]?.tagTitle).toBe('Disabled:Item 1');
			expect(parsedCsv.data[0]?.labelTitles).toContain('Label 5 (Disabled)');

			parsedCsv.data[0] = {
				...parsedCsv.data[0],
				description: 'Changed while keeping disabled links'
			};

			const { importInfo } = await runJournalUpdateImportFile(
				db,
				createImportFileFromCsv(Papa.unparse(parsedCsv.data))
			);

			expect(importInfo?.importDetails[0]?.status).toBe('imported');

			const journals = await getTransactionJournals(db, seeded!.groceryTransactionId);
			const expenseJournal = journals.find((journal) => journal.id === seeded!.groceryExpenseId);
			const cashJournal = journals.find((journal) => journal.id === seeded!.groceryCashId);

			expect(expenseJournal).toMatchObject({
				description: 'Changed while keeping disabled links',
				tagId: 'Tag5'
			});
			expect(cashJournal).toMatchObject({
				description: 'Changed while keeping disabled links',
				tagId: 'Tag5'
			});

			expect(expenseJournal?.labels.map((item) => item.label?.title).sort()).toEqual([
				'Imported Label',
				'Label 1',
				'Label 5 (Disabled)'
			]);
			expect(cashJournal?.labels.map((item) => item.label?.title).sort()).toEqual([
				'Label 5 (Disabled)'
			]);
		}
	);

	testIt(
		'does not re-resolve unchanged disabled accounts during import when other fields change',
		async (db) => {
			const seeded = seededTransactions;
			expect(seeded).toBeDefined();

			await db
				.update(journalEntry)
				.set({
					accountId: 'Account9',
					...updatedTime()
				})
				.where(eq(journalEntry.id, seeded!.groceryExpenseId));

			await db
				.update(journalEntry)
				.set({
					accountId: 'Account8',
					...updatedTime()
				})
				.where(eq(journalEntry.id, seeded!.groceryCashId));

			await materializedViewActions.refresh();

			const exportedCsv = await journalMaterializedViewActions.generateCSVData({
				filter: {
					idArray: [seeded!.groceryExpenseId],
					account: { type: ['asset', 'liability', 'expense', 'income'] }
				},
				returnType: 'journalUpdate'
			});

			const parsedCsv = Papa.parse<Record<string, string>>(exportedCsv, { header: true });
			expect(parsedCsv.errors).toEqual([]);
			expect(parsedCsv.data[0]?.accountTitle).toBe('Debt:Travel Card');
			expect(parsedCsv.data[0]?.otherAccountTitle).toBe('Archived Salary');

			parsedCsv.data[0] = {
				...parsedCsv.data[0],
				description: 'Changed while keeping disabled accounts'
			};

			const { importInfo } = await runJournalUpdateImportFile(
				db,
				createImportFileFromCsv(Papa.unparse(parsedCsv.data))
			);

			expect(importInfo?.importDetails[0]?.status).toBe('imported');

			const journals = await getTransactionJournals(db, seeded!.groceryTransactionId);
			const expenseJournal = journals.find((journal) => journal.id === seeded!.groceryExpenseId);
			const cashJournal = journals.find((journal) => journal.id === seeded!.groceryCashId);

			expect(expenseJournal).toMatchObject({
				description: 'Changed while keeping disabled accounts',
				accountId: 'Account9'
			});
			expect(cashJournal).toMatchObject({
				description: 'Changed while keeping disabled accounts',
				accountId: 'Account8'
			});
			expect(expenseJournal?.account?.accountTitleCombined).toBe('Debt:Travel Card');
			expect(cashJournal?.account?.accountTitleCombined).toBe('Archived Salary');
		}
	);

	testIt(
		'does not re-resolve unchanged disabled bill budget and category during import when other fields change',
		async (db) => {
			const seeded = seededTransactions;
			expect(seeded).toBeDefined();

			await db
				.update(journalEntry)
				.set({
					billId: 'Bill5',
					budgetId: 'Budget5',
					categoryId: 'Category5',
					...updatedTime()
				})
				.where(eq(journalEntry.id, seeded!.groceryExpenseId));

			await materializedViewActions.refresh();

			const exportedCsv = await journalMaterializedViewActions.generateCSVData({
				filter: {
					idArray: [seeded!.groceryExpenseId],
					account: { type: ['asset', 'liability', 'expense', 'income'] }
				},
				returnType: 'journalUpdate'
			});

			const parsedCsv = Papa.parse<Record<string, string>>(exportedCsv, { header: true });
			expect(parsedCsv.errors).toEqual([]);
			expect(parsedCsv.data[0]?.billTitle).toBe('Schooling (Disabled)');
			expect(parsedCsv.data[0]?.budgetTitle).toBe('Schooling (Disabled)');
			expect(parsedCsv.data[0]?.categoryTitle).toBe('Disabled:Item 1');

			parsedCsv.data[0] = {
				...parsedCsv.data[0],
				description: 'Changed while keeping disabled linked metadata'
			};

			const { importInfo } = await runJournalUpdateImportFile(
				db,
				createImportFileFromCsv(Papa.unparse(parsedCsv.data))
			);

			expect(importInfo?.importDetails[0]?.status).toBe('imported');

			const journals = await getTransactionJournals(db, seeded!.groceryTransactionId);
			const expenseJournal = journals.find((journal) => journal.id === seeded!.groceryExpenseId);
			const cashJournal = journals.find((journal) => journal.id === seeded!.groceryCashId);

			expect(expenseJournal).toMatchObject({
				description: 'Changed while keeping disabled linked metadata',
				billId: 'Bill5',
				budgetId: 'Budget5',
				categoryId: 'Category5'
			});
			expect(expenseJournal?.bill?.title).toBe('Schooling (Disabled)');
			expect(expenseJournal?.budget?.title).toBe('Schooling (Disabled)');
			expect(expenseJournal?.category?.title).toBe('Disabled:Item 1');

			expect(cashJournal).toMatchObject({
				description: 'Changed while keeping disabled linked metadata'
			});
		}
	);
});
