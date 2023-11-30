import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { accountActions } from './accountActions';
import { createTestDB, initialiseTestDB, tearDownTestDB } from '../test/dbTest';

describe('accountActions', async () => {
	const { db, sqliteDatabase, filename } = await createTestDB('accountActions');

	beforeEach(async () => {
		await initialiseTestDB({ db, accounts: true });
	});

	afterAll(async () => {
		await tearDownTestDB({ sqliteDatabase, filename });
	});

	describe('createAccount', async () => {
		it('Created Account Should Have Correct Group Data - (asset / liability)', async () => {
			const types = ['income', 'expense'] as const;

			await Promise.all(
				types.map(async (type) => {
					const title = `Test ${type} Account`;

					const createdAccount = await accountActions.createAndGet(db, {
						title,
						type: 'asset',
						accountGroupCombined: 'Group1:Group2:Group3',
						status: 'active'
					});

					expect(createdAccount).not.toBeUndefined();

					expect(createdAccount?.title).toEqual(title);
					expect(createdAccount?.accountGroup).toEqual('Group1');
					expect(createdAccount?.accountGroup2).toEqual('Group2');
					expect(createdAccount?.accountGroup3).toEqual('Group3');
					expect(createdAccount?.accountGroupCombined).toEqual('Group1:Group2:Group3');
					expect(createdAccount?.accountTitleCombined).toEqual(`Group1:Group2:Group3:${title}`);
				})
			);
		});

		it('Created income  / expense Account Should Have Correct Group Data - (income / expense)', async () => {
			const types = ['income', 'expense'] as const;

			await Promise.all(
				types.map(async (type) => {
					const title = `Test ${type} Account`;
					const createdAccount = await accountActions.createAndGet(db, {
						title,
						type,
						accountGroupCombined: 'Group1:Group2:Group3',
						status: 'active'
					});

					expect(createdAccount).not.toBeUndefined();
					expect(createdAccount?.title).toEqual(title);
					expect(createdAccount?.accountGroup).toEqual('');
					expect(createdAccount?.accountGroup2).toEqual('');
					expect(createdAccount?.accountGroup3).toEqual('');
					expect(createdAccount?.accountGroupCombined).toEqual('');
					expect(createdAccount?.accountTitleCombined).toEqual(title);
				})
			);
		});

		it('Created Account Should Reflect Correct Status', async () => {
			const statuses = ['active', 'disabled'] as const;

			await Promise.all(
				statuses.map(async (status) => {
					const title = `Test Account with status ${status}`;

					const createdAccount = await accountActions.createAndGet(db, {
						title,
						type: 'asset',
						accountGroupCombined: 'Group1:Group2:Group3',
						status
					});

					expect(createdAccount?.status).toEqual(status);
				})
			);
		});

		it('Creating an account With Long End Date Should Work Correctly', async () => {
			const endDate = new Date().toISOString();
			expect(() =>
				accountActions.createAndGet(db, {
					title: 'Created Account',
					type: 'asset',
					accountGroupCombined: 'Group1:Group2:Group3',
					status: 'active',
					startDate: '2020-02-02',
					endDate
				})
			).rejects.toThrowError('End date must be 10 characters');
		});

		it('Creating an account With Long Start Date Should Work Correctly', async () => {
			const startDate = new Date().toISOString();
			expect(() =>
				accountActions.createAndGet(db, {
					title: 'Created Account',
					type: 'asset',
					accountGroupCombined: 'Group1:Group2:Group3',
					status: 'active',
					endDate: '2020-02-02',
					startDate
				})
			).rejects.toThrowError('Start date must be 10 characters');
		});

		it('Creating an account With A Bad End Date Should Error', async () => {
			expect(
				async () =>
					await accountActions.createAndGet(db, {
						title: 'Created Account',
						type: 'asset',
						accountGroupCombined: 'Group1:Group2:Group3',
						status: 'active',
						startDate: '2020-02-02',
						endDate: '2021-13-01'
					})
			).rejects.toThrowError('End date is not a valid date');
		});

		it('Creating an account With A Bad Start Date Should Error', async () => {
			expect(
				async () =>
					await accountActions.createAndGet(db, {
						title: 'Created Account',
						type: 'asset',
						accountGroupCombined: 'Group1:Group2:Group3',
						status: 'active',
						startDate: '2020-00-02',
						endDate: '2021-12-01'
					})
			).rejects.toThrowError('Start date is not a valid date');
		});

		it('Creating accounts with the same combined title will cause an error', async () => {
			const title = 'Test Account';
			const accountGroupCombined = 'Group1:Group2:Group3';
			const status = 'active';

			await accountActions.createAndGet(db, {
				title,
				type: 'asset',
				accountGroupCombined,
				status
			});

			expect(
				async () =>
					await accountActions.createAndGet(db, {
						title,
						type: 'liability',
						accountGroupCombined,
						status
					})
			).rejects.toThrowError('UNIQUE constraint failed');
		});
	});
});
