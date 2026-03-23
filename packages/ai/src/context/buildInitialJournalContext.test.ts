import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
	clearTestDB,
	closeTestDB,
	getTestDB,
	initialiseTestDB,
	testImportSeedIds,
	withTestDbContext
} from '@totallator/business-logic/testing';
import type { DBType } from '@totallator/database';
import { journalEntry } from '@totallator/database';
import { and, eq } from 'drizzle-orm';

import { buildInitialJournalContext } from './buildInitialJournalContext';

describe('buildInitialJournalContext', () => {
	let dbConnection: Awaited<ReturnType<typeof getTestDB>>;
	let db: DBType;

	beforeAll(async () => {
		dbConnection = await getTestDB();
		db = dbConnection.testDB;
	}, 30000);

	beforeEach(async () => {
		await withTestDbContext(db, async () => {
			await clearTestDB(db, { refreshViews: false });
			await initialiseTestDB({
				db,
				accounts: true,
				bills: true,
				budgets: true,
				categories: true,
				labels: true,
				tags: true,
				transactions: true,
				refreshViews: false
			});
		});
	}, 30000);

	afterAll(async () => {
		await closeTestDB(dbConnection);
	});

	it('builds the substantial initial context using the stub tool data functions', async () => {
		await withTestDbContext(db, async () => {
			const groceryJournal = await db.query.journalEntry.findFirst({
				where: and(
					eq(journalEntry.importDetailId, testImportSeedIds.transaction.importDetail2Id),
					eq(journalEntry.amount, -89.45)
				)
			});

			const result = await buildInitialJournalContext({
				db,
				journalIds: [groceryJournal!.id]
			});

			expect(result.journalContext.journals).toHaveLength(1);
			expect(result.importSimilarity.matches[0]?.targetJournalId).toBe(groceryJournal!.id);
			expect(result.journalSimilarity.notes.length).toBeGreaterThan(0);
			expect(result.notes.length).toBeGreaterThan(0);
		});
	});
});
