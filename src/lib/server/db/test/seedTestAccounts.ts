import type { DBType } from '../db';
import { account } from '../postgres/schema';
import { accountCreateInsertionData } from '../actions/helpers/account/accountCreateInsertionData';

export const seedTestAccounts = async (db: DBType, id: string) => {
	await db.insert(account).values([
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
				isCash: true,
				isNetWorth: true
			},
			`Account2`
		),
		accountCreateInsertionData(
			{
				title: 'Debt',
				accountGroupCombined: `Cash`,
				status: 'active',
				type: 'liability',
				isCash: true,
				isNetWorth: true
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
				isCash: true,
				isNetWorth: true
			},
			`Account6`
		)
	]);
};
