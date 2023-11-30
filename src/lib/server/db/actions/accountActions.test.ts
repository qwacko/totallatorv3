import { afterAll, vi, beforeEach, describe, expect, it } from 'vitest';

import { accountActions } from './accountActions';
import { createTestDB, initialiseTestDB, tearDownTestDB } from '../test/dbTest';
import { account } from '../schema';
import { eq } from 'drizzle-orm';

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

	describe('getById', async () => {
		it('Should return the correct account', async () => {
			const account = await accountActions.getById(db, 'Account1');

			expect(account).not.toBeUndefined();
			expect(account?.id).toEqual('Account1');
			expect(account?.title).toEqual('Cash');
		});

		it('Should return undefined if no account is found', async () => {
			const account = await accountActions.getById(db, 'Account0');

			expect(account).toBeUndefined();
		});
	});

	describe('count', async () => {
		it('Should return the correct number of accounts', async () => {
			const count = await accountActions.count(db);

			expect(count).toEqual(6);
		});

		it('Should return the correct number of accounts when filtered', async () => {
			const count = await accountActions.count(db, { type: ['asset'] });

			expect(count).toEqual(2);
		});

		it('Should Return 0 When No Accounts Are Found', async () => {
			const count = await accountActions.count(db, { title: 'Doesnt Exist' });

			expect(count).toEqual(0);
		});
	});

	describe('createOrGet', async () => {
		it('Should return the correct account when it exists', async () => {
			const account = await accountActions.createOrGet({
				db,
				title: 'Cash:Cash'
			});

			expect(account).not.toBeUndefined();
			expect(account?.id).toEqual('Account1');
			expect(account?.title).toEqual('Cash');
		});

		it('Should return the correct account when it does not exist', async () => {
			const account = await accountActions.createOrGet({
				db,
				title: 'New Account'
			});

			expect(account).not.toBeUndefined();
			expect(account?.title).toEqual('New Account');
		});

		it('If Id is supplied, it will fuction correctly', async () => {
			const account = await accountActions.createOrGet({
				db,
				id: 'Account1'
			});

			expect(account).not.toBeUndefined();
			expect(account?.title).toEqual('Cash');
		});
		it("If Id is supplied and doesn't exist, an error is thrown", async () => {
			expect(
				async () =>
					await accountActions.createOrGet({
						db,
						id: 'Account11'
					})
			).rejects.toThrowError('Account Account11 not found');
		});

		it('If accout is disabled, and requireActive is true, an error is thrown', async () => {
			await db.update(account).set({ status: 'disabled' }).where(eq(account.id, 'Account1'));

			expect(
				async () =>
					await accountActions.createOrGet({
						db,
						id: 'Account1',
						requireActive: true
					})
			).rejects.toThrowError('Account Cash is not active');
		});

		it('If Account is disabled and searched for by name, an error is thrown', async () => {
			await db.update(account).set({ status: 'disabled' }).where(eq(account.id, 'Account1'));

			expect(
				async () =>
					await accountActions.createOrGet({
						db,
						title: 'Cash:Cash'
					})
			).rejects.toThrowError('Account Cash is not active');
		});

		it('If Title or Id is not supplied, undefined is returned', async () => {
			const account = await accountActions.createOrGet({
				db
			});

			expect(account).toBeUndefined();
		});
	});

	describe('update', async () => {
		it('Should update the account correctly (asset / liability)', async () => {
			await accountActions.update({
				db,
				id: 'Account1',
				data: {
					title: 'Updated Account',
					type: 'liability',
					accountGroupCombined: 'Group1:Group2:Group3',
					status: 'disabled'
				}
			});

			const updatedAccount = await accountActions.getById(db, 'Account1');

			expect(updatedAccount).not.toBeUndefined();
			expect(updatedAccount?.title).toEqual('Updated Account');
			expect(updatedAccount?.type).toEqual('liability');
			expect(updatedAccount?.accountGroupCombined).toEqual('Group1:Group2:Group3');
			expect(updatedAccount?.status).toEqual('disabled');
		});

		it('Should update the account correctly (income / expense)', async () => {
			await accountActions.update({
				db,
				id: 'Account4',
				data: {
					title: 'Updated Account',
					type: 'income',
					accountGroupCombined: 'Group1:Group2:Group3',
					status: 'disabled'
				}
			});

			const updatedAccount = await accountActions.getById(db, 'Account4');

			expect(updatedAccount).not.toBeUndefined();
			expect(updatedAccount?.title).toEqual('Updated Account');
			expect(updatedAccount?.type).toEqual('income');
			expect(updatedAccount?.accountGroupCombined).toEqual('');
			expect(updatedAccount?.status).toEqual('disabled');
		});

		it('Switching an asset to an income / expense should clear the accountGroupCombined', async () => {
			await accountActions.update({
				db,
				id: 'Account1',
				data: {
					title: 'Updated Account',
					type: 'income',
					accountGroupCombined: 'Group1:Group2:Group3',
					status: 'disabled'
				}
			});

			const updatedAccount = await accountActions.getById(db, 'Account1');

			expect(updatedAccount).not.toBeUndefined();
			expect(updatedAccount?.title).toEqual('Updated Account');
			expect(updatedAccount?.type).toEqual('income');
			expect(updatedAccount?.accountGroupCombined).toEqual('');
			expect(updatedAccount?.status).toEqual('disabled');
		});

		it('Switching an income / expense to an asset should allow account group to be set', async () => {
			await accountActions.update({
				db,
				id: 'Account4',
				data: {
					title: 'Updated Account',
					type: 'asset',
					accountGroupCombined: 'Group1:Group2:Group3',
					status: 'disabled'
				}
			});

			const updatedAccount = await accountActions.getById(db, 'Account4');

			expect(updatedAccount).not.toBeUndefined();
			expect(updatedAccount?.title).toEqual('Updated Account');
			expect(updatedAccount?.type).toEqual('asset');
			expect(updatedAccount?.accountGroupCombined).toEqual('Group1:Group2:Group3');
			expect(updatedAccount?.status).toEqual('disabled');
		});

		it('Should throw an error if account does not exist', async () => {
			expect(
				async () =>
					await accountActions.update({
						db,
						id: 'Account0',
						data: {
							title: 'Updated Account',
							type: 'asset',
							accountGroupCombined: 'Group1:Group2:Group3',
							status: 'disabled'
						}
					})
			).rejects.toThrowError('Account Account0 not found');
		});

		it('Updating an account updates updatedAt (for both asset and expense)', async () => {
			vi.useFakeTimers();

			const date = new Date(2020, 1, 1, 1, 0, 0, 0);
			vi.setSystemTime(date);

			await accountActions.update({
				db,
				id: 'Account1',
				data: {
					title: 'Updated Account',
					type: 'asset',
					accountGroupCombined: 'Group1:Group2:Group3',
					status: 'disabled'
				}
			});
			await accountActions.update({
				db,
				id: 'Account4',
				data: {
					title: 'Updated Account',
					type: 'expense',
					accountGroupCombined: 'Group1:Group2:Group3',
					status: 'disabled'
				}
			});

			vi.useRealTimers();

			const updatedAccount = await accountActions.getById(db, 'Account1');
			const updatedAccount2 = await accountActions.getById(db, 'Account4');

			expect(updatedAccount?.updatedAt).toEqual(date);
			expect(updatedAccount2?.updatedAt).toEqual(date);
		});

		it('Updating the status will update related items correctly (asset and expense)', async () => {
			await accountActions.update({
				db,
				id: 'Account1',
				data: {
					title: 'Updated Account',
					type: 'asset',
					accountGroupCombined: 'Group1:Group2:Group3',
					status: 'disabled'
				}
			});
			await accountActions.update({
				db,
				id: 'Account4',
				data: {
					title: 'Updated Account',
					type: 'expense',
					accountGroupCombined: 'Group1:Group2:Group3',
					status: 'disabled'
				}
			});

			const updatedAccount = await accountActions.getById(db, 'Account1');
			const updatedAccount2 = await accountActions.getById(db, 'Account4');

			expect(updatedAccount?.active).toEqual(false);
			expect(updatedAccount?.disabled).toEqual(true);
			expect(updatedAccount2?.active).toEqual(false);
			expect(updatedAccount2?.disabled).toEqual(true);
		});
	});

	describe('updateMany', async () => {
		it('Disable All Assets Works Correctly', async () => {
			await accountActions.updateMany({
				db,
				data: {
					status: 'disabled'
				},
				filter: {
					type: ['asset']
				}
			});

			const accounts = await db.select().from(account).where(eq(account.type, 'asset')).execute();

			accounts.forEach((account) => {
				expect(account.active).toEqual(false);
				expect(account.disabled).toEqual(true);
			});

			const liabilityAccounts = await db
				.select()
				.from(account)
				.where(eq(account.type, 'liability'))
				.execute();

			liabilityAccounts.forEach((account) => {
				expect(account.active).toEqual(true);
				expect(account.disabled).toEqual(false);
			});
		});
	});
});
