import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { accountFilterToQuery, accountFilterToText } from './accountFilterToQuery';
import { and } from 'drizzle-orm';
import { account } from '../../../schema';
import { QueryBuilder } from 'drizzle-orm/sqlite-core';
import { createTestDB, initialiseTestDB, tearDownTestDB } from '../../../test/dbTest';

describe('Account Filter To Query', () => {
	const qb = new QueryBuilder();
	it('Filter Returns A Good Value', () => {
		const returnValue = accountFilterToQuery(
			{
				id: 'id',
				idArray: ['idArray1', 'idArray2'],
				title: 'title',
				accountGroup3: 'accountGroup3',
				accountGroup2: 'accountGroup2',
				accountGroup: 'thisAccountGroup',
				accountGroupCombined: 'accountGroupCombined',
				accountTitleCombined: 'accountTitleCombined',
				status: 'active',
				disabled: false,
				allowUpdate: true,
				active: false,
				isCash: true,
				isNetWorth: false,
				startDateAfter: '2021-01-01',
				startDateBefore: '2021-01-02',
				endDateAfter: '2021-01-03',
				endDateBefore: '2021-01-04',
				importIdArray: ['importId1', 'importId2'],
				importDetailIdArray: ['importDetailId1', 'importDetailId2'],
				type: ['asset', 'liability'],
				countMax: 10
			},
			true
		);

		const query = qb
			.select()
			.from(account)
			.where(and(...returnValue))
			.toSQL();

		//Id
		expect(query.sql).toContain('"account"."id" = ?');
		expect(query.params).toHaveProperty('0', 'id');

		//Id Array
		expect(query.sql).toContain('"account"."id" in (?, ?)');
		expect(query.params).toHaveProperty('1', 'idArray1');
		expect(query.params).toHaveProperty('2', 'idArray2');

		//Title
		expect(query.sql).toContain('"account"."title" like ?');
		expect(query.params).toHaveProperty('3', '%title%');

		//Account Group
		expect(query.sql).toContain('"account"."account_group" like ?');
		expect(query.params).toHaveProperty('4', '%thisAccountGroup%');

		//Account Group 2
		expect(query.sql).toContain('"account"."account_group_2" like ?');
		expect(query.params).toHaveProperty('5', '%accountGroup2%');

		//Account Group 3
		expect(query.sql).toContain('"account"."account_group_3" like ?');
		expect(query.params).toHaveProperty('6', '%accountGroup3%');

		//Account Group Combined
		expect(query.sql).toContain('"account"."account_group_combined" like ?');
		expect(query.params).toHaveProperty('7', '%accountGroupCombined%');

		//Account Title Combined
		expect(query.sql).toContain('"account"."account_title_combined" like ?');
		expect(query.params).toHaveProperty('8', '%accountTitleCombined%');

		//Status
		expect(query.sql).toContain('"account"."status" = ?');
		expect(query.params).toHaveProperty('9', 'active');

		//Disabled
		expect(query.sql).toContain('"account"."disabled" = ?');
		expect(query.params).toHaveProperty('10', 0);

		//Allow Update
		expect(query.sql).toContain('"account"."allow_update" = ?');
		expect(query.params).toHaveProperty('11', 1);

		//Active
		expect(query.sql).toContain('"account"."active" = ?');
		expect(query.params).toHaveProperty('12', 0);

		//Is Cash
		expect(query.sql).toContain('"account"."is_cash" = ?');
		expect(query.params).toHaveProperty('13', 1);

		//Is Net Worth
		expect(query.sql).toContain('"account"."is_net_worth" = ?');
		expect(query.params).toHaveProperty('14', 0);

		//Start Date After
		expect(query.sql).toContain('"account"."start_date" > ?');
		expect(query.params).toHaveProperty('15', '2021-01-01');

		//Start Date Before
		expect(query.sql).toContain('"account"."start_date" < ?');
		expect(query.params).toHaveProperty('16', '2021-01-02');

		//End Date After
		expect(query.sql).toContain('"account"."end_date" > ?');
		expect(query.params).toHaveProperty('17', '2021-01-03');

		//End Date Before
		expect(query.sql).toContain('"account"."end_date" < ?');
		expect(query.params).toHaveProperty('18', '2021-01-04');

		//Import Id Array
		expect(query.sql).toContain('"account"."import_id" in (?, ?)');
		expect(query.params).toHaveProperty('19', 'importId1');
		expect(query.params).toHaveProperty('20', 'importId2');

		//Import Detail Id Array
		expect(query.sql).toContain('"account"."account_import_detail_id" in (?, ?)');
		expect(query.params).toHaveProperty('21', 'importDetailId1');
		expect(query.params).toHaveProperty('22', 'importDetailId2');

		//Type
		expect(query.sql).toContain('"account"."type" in (?, ?)');
		expect(query.params).toHaveProperty('23', 'asset');
		expect(query.params).toHaveProperty('24', 'liability');

		//Count Max
		expect(query.sql).toContain('"summary"."count" <= ?');
		expect(query.params).toHaveProperty('25', 10);
	});

	it("If include summary is turned off, then count max doesn't have impact", () => {
		const returnValue = accountFilterToQuery(
			{
				countMax: 10
			},
			false
		);

		const query = qb
			.select()
			.from(account)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"summary"."count" <= ?');
	});

	it('If dates are not real dates, they are still passed through', () => {
		const returnValue = accountFilterToQuery(
			{
				endDateAfter: '2020-00-00',
				startDateBefore: "this isn't a date"
			},
			false
		);

		const query = qb
			.select()
			.from(account)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).toContain('"account"."end_date" > ?');
		expect(query.params).toHaveProperty('1', '2020-00-00');

		expect(query.sql).toContain('"account"."start_date" < ?');
		expect(query.params).toHaveProperty('0', "this isn't a date");
	});

	it('Id Array is not used if the array is empty', () => {
		const returnValue = accountFilterToQuery(
			{
				idArray: []
			},
			false
		);

		const query = qb
			.select()
			.from(account)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"account"."id" in (?, ?)');
	});

	it('Import Id Array is not used if the array is empty', () => {
		const returnValue = accountFilterToQuery(
			{
				importIdArray: []
			},
			false
		);

		const query = qb
			.select()
			.from(account)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"account"."import_id" in (?, ?)');
	});

	it('Import Detail Id Array is not used if the array is empty', () => {
		const returnValue = accountFilterToQuery(
			{
				importDetailIdArray: []
			},
			false
		);

		const query = qb
			.select()
			.from(account)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"account"."account_import_detail_id" in (?, ?)');
	});

	it('Type is not used if the array is empty', () => {
		const returnValue = accountFilterToQuery(
			{
				type: []
			},
			false
		);

		const query = qb
			.select()
			.from(account)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"account"."type" in (?, ?)');
	});
});

describe('Account Filter To Text', async () => {
	const { db, sqliteDatabase, filename } = await createTestDB();

	beforeEach(async () => {
		await initialiseTestDB({ db, accounts: true });
	});

	afterAll(async () => {
		await tearDownTestDB({ sqliteDatabase, filename });
	});

	it('Filter Returns Useful Text', async () => {
		const returnValue = await accountFilterToText({
			db,
			filter: {
				title: 'title',
				accountGroup3: 'accountGroup3',
				accountGroup2: 'accountGroup2',
				accountGroup: 'thisAccountGroup',
				accountGroupCombined: 'accountGroupCombined',
				accountTitleCombined: 'accountTitleCombined',
				status: 'active',
				disabled: false,
				allowUpdate: true,
				active: false,
				isCash: true,
				isNetWorth: false,
				startDateAfter: '2021-01-01',
				startDateBefore: '2021-01-02',
				endDateAfter: '2021-01-03',
				endDateBefore: '2021-01-04',
				type: ['asset', 'liability'],
				countMax: 10
			}
		});

		expect(returnValue).toHaveProperty('0', 'Title contains title');
		expect(returnValue).toHaveProperty('1', 'Group contains thisAccountGroup');
		expect(returnValue).toHaveProperty('2', 'Group 2 contains accountGroup2');
		expect(returnValue).toHaveProperty('3', 'Group 3 contains accountGroup3');
		expect(returnValue).toHaveProperty('4', 'Group Combined contains accountGroupCombined');
		expect(returnValue).toHaveProperty(
			'5',
			'Group Combined With Title contains accountTitleCombined'
		);
		expect(returnValue).toHaveProperty('6', 'Status equals active');
		expect(returnValue).toHaveProperty('7', 'Is Not Disabled');
		expect(returnValue).toHaveProperty('8', 'Can Be Updated');
		expect(returnValue).toHaveProperty('9', 'Is Cash');
		expect(returnValue).toHaveProperty('10', 'Is Net Worth');
		expect(returnValue).toHaveProperty('11', 'Start Date Is After 2021-01-01');
		expect(returnValue).toHaveProperty('12', 'Start Date Is Before 2021-01-02');
		expect(returnValue).toHaveProperty('13', 'End Date Is After 2021-01-03');
		expect(returnValue).toHaveProperty('14', 'End Date Is Before 2021-01-04');
		expect(returnValue).toHaveProperty('15', 'Type is one of asset, liability');
		expect(returnValue).toHaveProperty('16', 'Max Journal Count of 10');
	});

	it('Filter For Account Id Works Correctly', async () => {
		const returnValue = await accountFilterToText({
			db,
			filter: {
				id: 'Account1'
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is Cash');
	});

	it('Filter For Account Id Array Works Correctly (2 Values)', async () => {
		const returnValue = await accountFilterToText({
			db,
			filter: {
				idArray: ['Account1', 'Account2']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of Cash, Bank');
	});

	it('Filter For Account Id Array Works Correctly (4 Values)', async () => {
		const returnValue = await accountFilterToText({
			db,
			filter: {
				idArray: ['Account1', 'Account2', 'Account3', 'Account4']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of Cash, Bank, Debt, Shop 1');
	});

	it('Filter For Account Id Array Works Correctly (5 Values)', async () => {
		const returnValue = await accountFilterToText({
			db,
			filter: {
				idArray: ['Account1', 'Account2', 'Account3', 'Account4', 'Account5']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of 5 values');
	});

	it('Filter For Account Type Array Works Correctly', async () => {
		const returnValue = await accountFilterToText({
			db,
			filter: {
				type: ['asset', 'liability']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Type is one of asset, liability');
	});

	it('No filters returns expected text (Showing All)', async () => {
		const returnValue = await accountFilterToText({
			db,
			filter: {}
		});

		expect(returnValue).toHaveProperty('0', 'Showing All');
	});

	it('Prefixes Work Correctly', async () => {
		const returnValue = await accountFilterToText({
			db,
			filter: {
				title: 'Account1'
			},
			prefix: 'Test Prefix'
		});

		expect(returnValue).toHaveProperty('0', 'Test Prefix Title contains Account1');
	});
});
