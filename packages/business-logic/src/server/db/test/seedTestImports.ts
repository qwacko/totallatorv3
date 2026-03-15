import type { DBType } from '@totallator/database';
import { importItemDetail, importTable } from '@totallator/database';

import { updatedTime } from '../../../actions/helpers/misc/updatedTime';

export const testImportSeedIds = {
	account: {
		importId: 'ImportAccount1',
		importDetailId: 'ImportDetailAccount1'
	},
	bill: {
		importId: 'ImportBill1',
		importDetailId: 'ImportDetailBill1'
	},
	budget: {
		importId: 'ImportBudget1',
		importDetailId: 'ImportDetailBudget1'
	},
	category: {
		importId: 'ImportCategory1',
		importDetailId: 'ImportDetailCategory1'
	},
	tag: {
		importId: 'ImportTag1',
		importDetailId: 'ImportDetailTag1'
	},
	label: {
		importId: 'ImportLabel1',
		importDetailId: 'ImportDetailLabel1'
	},
	transaction: {
		importId: 'ImportTransaction1',
		importDetailId: 'ImportDetailTransaction1',
		importDetail2Id: 'ImportDetailTransaction2'
	}
} as const;

export const seedTestImports = async (db: DBType) => {
	await db.insert(importTable).values([
		{
			id: testImportSeedIds.account.importId,
			title: 'Account Test Import',
			filename: 'account-test.csv',
			status: 'complete',
			source: 'csv',
			type: 'account',
			...updatedTime()
		},
		{
			id: testImportSeedIds.bill.importId,
			title: 'Bill Test Import',
			filename: 'bill-test.csv',
			status: 'complete',
			source: 'csv',
			type: 'bill',
			...updatedTime()
		},
		{
			id: testImportSeedIds.budget.importId,
			title: 'Budget Test Import',
			filename: 'budget-test.csv',
			status: 'complete',
			source: 'csv',
			type: 'budget',
			...updatedTime()
		},
		{
			id: testImportSeedIds.category.importId,
			title: 'Category Test Import',
			filename: 'category-test.csv',
			status: 'complete',
			source: 'csv',
			type: 'category',
			...updatedTime()
		},
		{
			id: testImportSeedIds.tag.importId,
			title: 'Tag Test Import',
			filename: 'tag-test.csv',
			status: 'complete',
			source: 'csv',
			type: 'tag',
			...updatedTime()
		},
		{
			id: testImportSeedIds.label.importId,
			title: 'Label Test Import',
			filename: 'label-test.csv',
			status: 'complete',
			source: 'csv',
			type: 'label',
			...updatedTime()
		},
		{
			id: testImportSeedIds.transaction.importId,
			title: 'Transaction Test Import',
			filename: 'transaction-test.csv',
			status: 'complete',
			source: 'csv',
			type: 'transaction',
			...updatedTime()
		}
	]);

	await db.insert(importItemDetail).values([
		{
			id: testImportSeedIds.account.importDetailId,
			importId: testImportSeedIds.account.importId,
			status: 'imported',
			statusText: 'Imported account fixture',
			uniqueId: 'account-test-fixture',
			...updatedTime()
		},
		{
			id: testImportSeedIds.bill.importDetailId,
			importId: testImportSeedIds.bill.importId,
			status: 'imported',
			statusText: 'Imported bill fixture',
			uniqueId: 'bill-test-fixture',
			...updatedTime()
		},
		{
			id: testImportSeedIds.budget.importDetailId,
			importId: testImportSeedIds.budget.importId,
			status: 'imported',
			statusText: 'Imported budget fixture',
			uniqueId: 'budget-test-fixture',
			...updatedTime()
		},
		{
			id: testImportSeedIds.category.importDetailId,
			importId: testImportSeedIds.category.importId,
			status: 'imported',
			statusText: 'Imported category fixture',
			uniqueId: 'category-test-fixture',
			...updatedTime()
		},
		{
			id: testImportSeedIds.tag.importDetailId,
			importId: testImportSeedIds.tag.importId,
			status: 'imported',
			statusText: 'Imported tag fixture',
			uniqueId: 'tag-test-fixture',
			...updatedTime()
		},
		{
			id: testImportSeedIds.label.importDetailId,
			importId: testImportSeedIds.label.importId,
			status: 'imported',
			statusText: 'Imported label fixture',
			uniqueId: 'label-test-fixture',
			...updatedTime()
		},
		{
			id: testImportSeedIds.transaction.importDetailId,
			importId: testImportSeedIds.transaction.importId,
			status: 'imported',
			statusText: 'Imported transaction fixture',
			uniqueId: 'transaction-test-fixture-1',
			...updatedTime()
		},
		{
			id: testImportSeedIds.transaction.importDetail2Id,
			importId: testImportSeedIds.transaction.importId,
			status: 'processed',
			statusText: 'Processed transaction fixture',
			uniqueId: 'transaction-test-fixture-2',
			...updatedTime()
		}
	]);
};
