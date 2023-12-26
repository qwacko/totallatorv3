import type { DBType } from '../db';
import { account } from '../postgres/schema';
import { accountCreateInsertionData } from '../actions/helpers/account/accountCreateInsertionData';

export const seedTestAccounts = async (db: DBType, id: string) => {
	await db.insert(account).values([
		accountCreateInsertionData(
			{
				title: 'Cash',
				accountGroupCombined: `Cash${id}`,
				status: 'active',
				type: 'asset',
				isCash: true,
				isNetWorth: true
			},
			`Account1${id}`
		),
		accountCreateInsertionData(
			{
				title: 'Bank',
				accountGroupCombined: `Cash${id}`,
				status: 'active',
				type: 'asset',
				isCash: true,
				isNetWorth: true
			},
			`Account2${id}`
		),
		accountCreateInsertionData(
			{
				title: 'Debt',
				accountGroupCombined: `Cash${id}`,
				status: 'active',
				type: 'liability',
				isCash: true,
				isNetWorth: true
			},
			`Account3${id}`
		),
		accountCreateInsertionData(
			{
				title: `Shop 1${id}`,
				accountGroupCombined: '',
				status: 'active',
				type: 'expense',
				isCash: true,
				isNetWorth: true
			},
			`Account4${id}`
		),
		accountCreateInsertionData(
			{
				title: `Shop 2${id}`,
				accountGroupCombined: '',
				status: 'active',
				type: 'expense',
				isCash: true,
				isNetWorth: true
			},
			`Account5${id}`
		),
		accountCreateInsertionData(
			{
				title: `Job 1${id}`,
				accountGroupCombined: '',
				status: 'active',
				type: 'income',
				isCash: true,
				isNetWorth: true
			},
			`Account6${id}`
		)
	])
};
