import { nanoid } from 'nanoid';

import type { DBType } from '@totallator/database';
import { journalEntry, labelsToJournals, transaction } from '@totallator/database';

import { expandDate } from '../../../actions/helpers/journal/expandDate';
import { updatedTime } from '../../../actions/helpers/misc/updatedTime';
import { testImportSeedIds } from './seedTestImports';

export const seedTestTransactions = async (db: DBType) => {
	const transferTransactionId = nanoid();
	const groceryTransactionId = nanoid();
	const transferOutId = nanoid();
	const transferInId = nanoid();
	const groceryExpenseId = nanoid();
	const groceryCashId = nanoid();

	await db.insert(transaction).values([
		{
			id: transferTransactionId,
			...updatedTime()
		},
		{
			id: groceryTransactionId,
			...updatedTime()
		}
	]);

	const transferDate = expandDate('2024-03-15');
	const groceryDate = expandDate('2024-03-16');

	await db.insert(journalEntry).values([
		{
			id: transferOutId,
			transactionId: transferTransactionId,
			accountId: 'Account1',
			amount: -150,
			description: 'Seeded transfer to savings',
			linked: true,
			transfer: true,
			reconciled: true,
			dataChecked: true,
			complete: true,
			importId: testImportSeedIds.transaction.importId,
			importDetailId: testImportSeedIds.transaction.importDetailId,
			...transferDate,
			...updatedTime()
		},
		{
			id: transferInId,
			transactionId: transferTransactionId,
			accountId: 'Account10',
			amount: 150,
			description: 'Seeded transfer to savings',
			linked: true,
			transfer: true,
			reconciled: true,
			dataChecked: true,
			complete: true,
			importId: testImportSeedIds.transaction.importId,
			importDetailId: testImportSeedIds.transaction.importDetailId,
			...transferDate,
			...updatedTime()
		},
		{
			id: groceryExpenseId,
			transactionId: groceryTransactionId,
			accountId: 'Account4',
			amount: 89.45,
			description: 'Seeded grocery purchase',
			billId: 'Bill1',
			budgetId: 'Budget1',
			categoryId: 'Category3',
			tagId: 'Tag1',
			linked: true,
			transfer: false,
			reconciled: false,
			dataChecked: true,
			complete: false,
			importId: testImportSeedIds.transaction.importId,
			importDetailId: testImportSeedIds.transaction.importDetail2Id,
			...groceryDate,
			...updatedTime()
		},
		{
			id: groceryCashId,
			transactionId: groceryTransactionId,
			accountId: 'Account1',
			amount: -89.45,
			description: 'Seeded grocery purchase',
			linked: true,
			transfer: false,
			reconciled: false,
			dataChecked: true,
			complete: false,
			importId: testImportSeedIds.transaction.importId,
			importDetailId: testImportSeedIds.transaction.importDetail2Id,
			...groceryDate,
			...updatedTime()
		}
	]);

	await db.insert(labelsToJournals).values([
		{
			id: nanoid(),
			labelId: 'Label1',
			journalId: groceryExpenseId,
			...updatedTime()
		},
		{
			id: nanoid(),
			labelId: 'Label7',
			journalId: groceryExpenseId,
			...updatedTime()
		}
	]);

	return {
		transferTransactionId,
		groceryTransactionId,
		transferOutId,
		transferInId,
		groceryExpenseId,
		groceryCashId
	};
};
