import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { accountFilterToQuery, accountFilterToText } from './accountFilterToQuery';
import { and } from 'drizzle-orm';
import { account } from '../../../postgres/schema';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import {
	clearTestDB,
	createTestWrapper,
	getTestDB,
	initialiseTestDB,
	closeTestDB
} from '../../../test/dbTest';
import { accountMaterializedView } from '$lib/server/db/postgres/schema/materializedViewSchema';

describe('Account Filter To Query', () => {
	const qb = new QueryBuilder();
	it('Filter Returns A Good Value', () => {
		const returnValue = accountFilterToQuery({
			filter: {
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
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(accountMaterializedView)
			.where(and(...returnValue))
			.toSQL();

		//Id
		expect(query.sql).toContain('"account_materialized_view"."id" = $');
		expect(query.params).toHaveProperty('0', 'id');

		//Id Array
		expect(query.sql).toContain('"account_materialized_view"."id" in ($');
		expect(query.params).toHaveProperty('1', 'idArray1');
		expect(query.params).toHaveProperty('2', 'idArray2');

		//Title
		expect(query.sql).toContain('"account_materialized_view"."title" ilike $');
		expect(query.params).toHaveProperty('3', '%title%');

		//Account Group
		expect(query.sql).toContain('"account_materialized_view"."account_group" ilike $');
		expect(query.params).toHaveProperty('4', '%thisAccountGroup%');

		//Account Group 2
		expect(query.sql).toContain('"account_materialized_view"."account_group_2" ilike $');
		expect(query.params).toHaveProperty('5', '%accountGroup2%');

		//Account Group 3
		expect(query.sql).toContain('"account_materialized_view"."account_group_3" ilike $');
		expect(query.params).toHaveProperty('6', '%accountGroup3%');

		//Account Group Combined
		expect(query.sql).toContain('"account_materialized_view"."account_group_combined" ilike $');
		expect(query.params).toHaveProperty('7', '%accountGroupCombined%');

		//Account Title Combined
		expect(query.sql).toContain('"account_materialized_view"."account_title_combined" ilike $');
		expect(query.params).toHaveProperty('8', '%accountTitleCombined%');

		//Status
		expect(query.sql).toContain('"account_materialized_view"."status" = $');
		expect(query.params).toHaveProperty('9', 'active');

		//Disabled
		expect(query.sql).toContain('"account_materialized_view"."disabled" = $');
		expect(query.params).toHaveProperty('10', false);

		//Allow Update
		expect(query.sql).toContain('"account_materialized_view"."allow_update" = $');
		expect(query.params).toHaveProperty('11', true);

		//Active
		expect(query.sql).toContain('"account_materialized_view"."active" = $');
		expect(query.params).toHaveProperty('12', false);

		//Is Cash
		expect(query.sql).toContain('"account_materialized_view"."is_cash" = $');
		expect(query.params).toHaveProperty('13', true);

		//Is Net Worth
		expect(query.sql).toContain('"account_materialized_view"."is_net_worth" = $');
		expect(query.params).toHaveProperty('14', false);

		//Start Date After
		expect(query.sql).toContain('"account_materialized_view"."start_date" > $');
		expect(query.params).toHaveProperty('15', '2021-01-01');

		//Start Date Before
		expect(query.sql).toContain('"account_materialized_view"."start_date" < $');
		expect(query.params).toHaveProperty('16', '2021-01-02');

		//End Date After
		expect(query.sql).toContain('"account_materialized_view"."end_date" > $');
		expect(query.params).toHaveProperty('17', '2021-01-03');

		//End Date Before
		expect(query.sql).toContain('"account_materialized_view"."end_date" < $');
		expect(query.params).toHaveProperty('18', '2021-01-04');

		//Import Id Array
		expect(query.sql).toContain('"account_materialized_view"."import_id" in ($');
		expect(query.params).toHaveProperty('19', 'importId1');
		expect(query.params).toHaveProperty('20', 'importId2');

		//Import Detail Id Array
		expect(query.sql).toContain('"account_materialized_view"."account_import_detail_id" in ($');
		expect(query.params).toHaveProperty('21', 'importDetailId1');
		expect(query.params).toHaveProperty('22', 'importDetailId2');

		//Type
		expect(query.sql).toContain('"account_materialized_view"."type" in ($');
		expect(query.params).toHaveProperty('23', 'asset');
		expect(query.params).toHaveProperty('24', 'liability');

		//Count Max
		expect(query.sql).toContain('"count" <= $');
		expect(query.params).toHaveProperty('25', 10);
	});

	it("If include summary is turned off, then count max doesn't have impact", () => {
		const returnValue = accountFilterToQuery({
			filter: {
				countMax: 10
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(accountMaterializedView)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"account_materialized_view"."count" <= ?');
	});

	it('If dates are not real dates, they are still passed through', () => {
		const returnValue = accountFilterToQuery({
			filter: {
				endDateAfter: '2020-00-00',
				startDateBefore: "this isn't a date"
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(accountMaterializedView)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).toContain('."end_date" > $');
		expect(query.params).toHaveProperty('1', '2020-00-00');

		expect(query.sql).toContain('."start_date" < $');
		expect(query.params).toHaveProperty('0', "this isn't a date");
	});

	it('Id Array is not used if the array is empty', () => {
		const returnValue = accountFilterToQuery({
			filter: {
				idArray: []
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(account)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"account_materialized_view"."id" in (?, ?)');
	});

	it('Import Id Array is not used if the array is empty', () => {
		const returnValue = accountFilterToQuery({
			filter: {
				importIdArray: []
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(accountMaterializedView)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"account_materialized_view"."import_id" in (?, ?)');
	});

	it('Import Detail Id Array is not used if the array is empty', () => {
		const returnValue = accountFilterToQuery({
			filter: {
				importDetailIdArray: []
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(accountMaterializedView)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain(
			'"account_materialized_view"."account_import_detail_id" in (?, ?)'
		);
	});

	it('Type is not used if the array is empty', () => {
		const returnValue = accountFilterToQuery({
			filter: {
				type: []
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(accountMaterializedView)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"account_materialized_view"."type" in (?, ?)');
	});
});

describe('Account Filter To Text', async () => {
	let db: undefined | Awaited<ReturnType<typeof getTestDB>> = undefined;

	beforeAll(async () => {
		db = await getTestDB();
	});
	afterAll(async () => {
		if (db) {
			await closeTestDB(db);
			db = undefined;
		}
	});

	const testIT = await createTestWrapper({
		getDB: () => (db ? db.testDB : undefined),
		beforeEach: async (db, id) => {
			await clearTestDB(db);
			await initialiseTestDB({ db, accounts: true, id });
		}
	});

	testIT('Filter Returns Useful Text', async (db) => {
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
		expect(returnValue).toHaveProperty('10', 'Is Not Net Worth');
		expect(returnValue).toHaveProperty('11', 'Start Date Is After 2021-01-01');
		expect(returnValue).toHaveProperty('12', 'Start Date Is Before 2021-01-02');
		expect(returnValue).toHaveProperty('13', 'End Date Is After 2021-01-03');
		expect(returnValue).toHaveProperty('14', 'End Date Is Before 2021-01-04');
		expect(returnValue).toHaveProperty('15', 'Type is one of asset, liability');
		expect(returnValue).toHaveProperty('16', 'Max Journal Count of 10');
	});

	testIT('Filter For Account Id Works Correctly', async (db) => {
		const returnValue = await accountFilterToText({
			db,
			filter: {
				id: 'Account1'
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is Cash');
	});

	testIT('Filter For Account Id Array Works Correctly (2 Values)', async (db) => {
		const returnValue = await accountFilterToText({
			db,
			filter: {
				idArray: ['Account1', 'Account2']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of Cash, Bank');
	});

	testIT('Filter For Account Id Array Works Correctly (4 Values)', async (db) => {
		const returnValue = await accountFilterToText({
			db,
			filter: {
				idArray: ['Account1', 'Account2', 'Account3', 'Account4']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of Cash, Bank, Debt, Shop 1');
	});

	testIT('Filter For Account Id Array Works Correctly (5 Values)', async (db) => {
		const returnValue = await accountFilterToText({
			db,
			filter: {
				idArray: ['Account1', 'Account2', 'Account3', 'Account4', 'Account5']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of 5 values');
	});

	testIT('Filter For Account Type Array Works Correctly', async (db) => {
		const returnValue = await accountFilterToText({
			db,
			filter: {
				type: ['asset', 'liability']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Type is one of asset, liability');
	});

	testIT('No filters returns expected text (Showing All)', async (db) => {
		const returnValue = await accountFilterToText({
			db,
			filter: {}
		});

		expect(returnValue).toHaveProperty('0', 'Showing All');
	});

	testIT('Prefixes Work Correctly', async (db) => {
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
