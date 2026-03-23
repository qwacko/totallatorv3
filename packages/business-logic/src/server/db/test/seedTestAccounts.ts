import type { DBType } from '@totallator/database';
import { account } from '@totallator/database';

import { accountCreateInsertionData } from '../../../actions/helpers/account/accountCreateInsertionData';
import { dbExecuteLogger } from '../dbLogger';

import { testImportSeedIds } from './seedTestImports';

export const seedTestAccounts = async (db: DBType) => {
	await dbExecuteLogger(
		db.insert(account).values([
			accountCreateInsertionData(
				{
					title: 'Cash',
					accountGroupCombined: `Cash`,
					status: 'active',
					type: 'asset',
					isCash: true,
					isNetWorth: true
				},
				`Account1`
			),
			accountCreateInsertionData(
				{
					title: 'Bank',
					accountGroupCombined: `Cash`,
					status: 'active',
					type: 'asset',
					isCash: false,
					isNetWorth: true,
					startDate: '2019-01-01'
				},
				`Account2`
			),
			accountCreateInsertionData(
				{
					title: 'Debt',
					accountGroupCombined: `Cash`,
					status: 'active',
					type: 'liability',
					isCash: false,
					isNetWorth: false,
					startDate: '2018-01-01',
					endDate: '2025-12-31'
				},
				`Account3`
			),
			accountCreateInsertionData(
				{
					title: `Shop 1`,
					accountGroupCombined: '',
					status: 'active',
					type: 'expense',
					isCash: true,
					isNetWorth: true
				},
				`Account4`
			),
			accountCreateInsertionData(
				{
					title: `Shop 2`,
					accountGroupCombined: '',
					status: 'active',
					type: 'expense',
					isCash: true,
					isNetWorth: true
				},
				`Account5`
			),
			accountCreateInsertionData(
				{
					title: `Job 1`,
					accountGroupCombined: '',
					status: 'active',
					type: 'income',
					isCatchall: false
				},
				`Account6`
			),
			accountCreateInsertionData(
				{
					title: `Catchall Expenses`,
					accountGroupCombined: '',
					status: 'active',
					type: 'expense',
					isCatchall: true
				},
				`Account7`
			),
			accountCreateInsertionData(
				{
					title: `Archived Salary`,
					accountGroupCombined: '',
					status: 'disabled',
					type: 'income'
				},
				`Account8`
			),
			accountCreateInsertionData(
				{
					title: 'Travel Card',
					accountGroupCombined: `Debt`,
					status: 'disabled',
					type: 'liability',
					isCash: false,
					isNetWorth: false,
					startDate: '2020-01-01',
					endDate: '2024-12-31'
				},
				`Account9`
			),
			accountCreateInsertionData(
				{
					title: 'Savings',
					accountGroupCombined: `Cash`,
					status: 'active',
					type: 'asset',
					isCash: false,
					isNetWorth: true,
					startDate: '2020-01-01',
					importId: testImportSeedIds.account.importId,
					importDetailId: testImportSeedIds.account.importDetailId
				},
				`Account10`
			)
		]),
		'Seed Test Accounts'
	);
};
