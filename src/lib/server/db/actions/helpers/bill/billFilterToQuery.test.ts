import { billFilterToQuery, billFilterToText } from './billFilterToQuery';
import { bill } from '../../../postgres/schema';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { and } from 'drizzle-orm';
import { getTestDB, initialiseTestDB, tearDownTestDB } from '$lib/server/db/test/dbTest';

// describe('billFilterToQuery', () => {
// 	const qb = new QueryBuilder();
// 	it('Filter Returns A Good Value', () => {
// 		const returnValue = billFilterToQuery(
// 			{
// 				id: 'id',
// 				idArray: ['idArray1', 'idArray2'],
// 				title: 'title',
// 				status: 'active',
// 				disabled: false,
// 				allowUpdate: true,
// 				active: false,
// 				importIdArray: ['importId1', 'importId2'],
// 				importDetailIdArray: ['importDetailId1', 'importDetailId2'],
// 				countMax: 10
// 			},
// 			true
// 		);

// 		const query = qb
// 			.select()
// 			.from(bill)
// 			.where(and(...returnValue))
// 			.toSQL();

// 		//Id
// 		expect(query.sql).toContain('"bill"."id" = ?');
// 		expect(query.params).toHaveProperty('0', 'id');

// 		//Id Array
// 		expect(query.sql).toContain('"bill"."id" in (?, ?)');
// 		expect(query.params).toHaveProperty('1', 'idArray1');
// 		expect(query.params).toHaveProperty('2', 'idArray2');

// 		//Title
// 		expect(query.sql).toContain('"bill"."title" like ?');
// 		expect(query.params).toHaveProperty('3', '%title%');

// 		//Status
// 		expect(query.sql).toContain('"bill"."status" = ?');
// 		expect(query.params).toHaveProperty('4', 'active');

// 		//Disabled
// 		expect(query.sql).toContain('"bill"."disabled" = ?');
// 		expect(query.params).toHaveProperty('5', 0);

// 		//Allow Update
// 		expect(query.sql).toContain('"bill"."allow_update" = ?');
// 		expect(query.params).toHaveProperty('6', 1);

// 		//Active
// 		expect(query.sql).toContain('"bill"."active" = ?');
// 		expect(query.params).toHaveProperty('7', 0);

// 		//Import Id Array
// 		expect(query.sql).toContain('"bill"."import_id" in (?, ?)');
// 		expect(query.params).toHaveProperty('8', 'importId1');
// 		expect(query.params).toHaveProperty('9', 'importId2');

// 		//Import Detail Id Array
// 		expect(query.sql).toContain('"bill"."bill_import_detail_id" in (?, ?)');
// 		expect(query.params).toHaveProperty('10', 'importDetailId1');
// 		expect(query.params).toHaveProperty('11', 'importDetailId2');

// 		//Count Max
// 		expect(query.sql).toContain('"summary"."count" <= ?');
// 		expect(query.params).toHaveProperty('12', 10);
// 	});

// 	it('Boolean Filters Work In Other Direction', () => {
// 		const returnValue = billFilterToQuery(
// 			{
// 				disabled: true,
// 				allowUpdate: false,
// 				active: true
// 			},
// 			true
// 		);

// 		const query = qb
// 			.select()
// 			.from(bill)
// 			.where(and(...returnValue))
// 			.toSQL();

// 		//Disabled
// 		expect(query.sql).toContain('"bill"."disabled" = ?');
// 		expect(query.params).toHaveProperty('0', 1);

// 		//Allow Update
// 		expect(query.sql).toContain('"bill"."allow_update" = ?');
// 		expect(query.params).toHaveProperty('1', 0);

// 		//Active
// 		expect(query.sql).toContain('"bill"."active" = ?');
// 		expect(query.params).toHaveProperty('2', 1);
// 	});

// 	it('Blank Filter Returns A Blank Value', () => {
// 		const returnValue = billFilterToQuery({}, true);

// 		const query = qb
// 			.select()
// 			.from(bill)
// 			.where(and(...returnValue))
// 			.toSQL();

// 		expect(query.sql).not.toContain('where');
// 	});

// 	it('Blank Title and ID Return A Blank Value', () => {
// 		const returnValue = billFilterToQuery(
// 			{
// 				id: '',
// 				title: ''
// 			},
// 			true
// 		);

// 		const query = qb
// 			.select()
// 			.from(bill)
// 			.where(and(...returnValue))
// 			.toSQL();

// 		expect(query.sql).not.toContain('where');
// 	});

// 	it("If include summary is turned off, then count max doesn't have impact", () => {
// 		const returnValue = billFilterToQuery(
// 			{
// 				countMax: 10
// 			},
// 			false
// 		);

// 		const query = qb
// 			.select()
// 			.from(bill)
// 			.where(and(...returnValue))
// 			.toSQL();

// 		expect(query.sql).not.toContain('"summary"."count" <= ?');
// 	});

// 	it('Id Array is not used if the array is empty', () => {
// 		const returnValue = billFilterToQuery(
// 			{
// 				idArray: []
// 			},
// 			false
// 		);

// 		const query = qb
// 			.select()
// 			.from(bill)
// 			.where(and(...returnValue))
// 			.toSQL();

// 		expect(query.sql).not.toContain('"bill"."id" in (?, ?)');
// 	});

// 	it('Import Id Array is not used if the array is empty', () => {
// 		const returnValue = billFilterToQuery(
// 			{
// 				importIdArray: []
// 			},
// 			false
// 		);

// 		const query = qb
// 			.select()
// 			.from(bill)
// 			.where(and(...returnValue))
// 			.toSQL();

// 		expect(query.sql).not.toContain('"bill"."import_id" in (?, ?)');
// 	});

// 	it('Import Detail Id Array is not used if the array is empty', () => {
// 		const returnValue = billFilterToQuery(
// 			{
// 				importDetailIdArray: []
// 			},
// 			false
// 		);

// 		const query = qb
// 			.select()
// 			.from(bill)
// 			.where(and(...returnValue))
// 			.toSQL();

// 		expect(query.sql).not.toContain('"bill"."bill_import_detail_id" in (?, ?)');
// 	});

// 	it('Filtering for disabled items works correctly', () => {
// 		const returnValue = billFilterToQuery(
// 			{
// 				disabled: true
// 			},
// 			false
// 		);

// 		const query = qb
// 			.select()
// 			.from(bill)
// 			.where(and(...returnValue))
// 			.toSQL();

// 		expect(query.sql).toContain('"bill"."disabled" = ?');
// 		expect(query.params).toHaveProperty('0', 1);
// 	});
// });

// describe('Bill Filter To Text', async () => {
// 	const { db, postgresDatabase, dbName } = await getTestDB();

// 	beforeEach(async () => {
// 		await initialiseTestDB({ db, bills: true });
// 	});

// 	afterAll(async () => {
// 		await tearDownTestDB({ postgresDatabase, dbName });
// 	});

// 	it('Filter Returns Useful Text', async () => {
// 		const returnValue = await billFilterToText({
// 			db,
// 			filter: {
// 				title: 'title',
// 				id: 'Bill1',
// 				status: 'active',
// 				disabled: false,
// 				allowUpdate: true,
// 				active: false,
// 				countMax: 10
// 			}
// 		});

// 		expect(returnValue).toHaveProperty('0', 'Is Power');
// 		expect(returnValue).toHaveProperty('1', 'Title contains title');
// 		expect(returnValue).toHaveProperty('2', 'Status equals active');
// 		expect(returnValue).toHaveProperty('3', 'Is Not Disabled');
// 		expect(returnValue).toHaveProperty('4', 'Can Be Updated');
// 		expect(returnValue).toHaveProperty('5', 'Max Journal Count of 10');
// 	});

// 	it('Filter For Bill Id Works Correctly', async () => {
// 		const returnValue = await billFilterToText({
// 			db,
// 			filter: {
// 				id: 'Bill2'
// 			}
// 		});

// 		expect(returnValue).toHaveProperty('0', 'Is Rent');
// 	});

// 	it('Filter For Bill Id Array Works Correctly (2 Values)', async () => {
// 		const returnValue = await billFilterToText({
// 			db,
// 			filter: {
// 				idArray: ['Bill1', 'Bill2']
// 			}
// 		});

// 		expect(returnValue).toHaveProperty('0', 'Is one of Power, Rent');
// 	});

// 	it('Filter For Bill Id Array Works Correctly (4 Values)', async () => {
// 		const returnValue = await billFilterToText({
// 			db,
// 			filter: {
// 				idArray: ['Bill1', 'Bill2', 'Bill3', 'Bill4']
// 			}
// 		});

// 		expect(returnValue).toHaveProperty('0', 'Is one of Power, Rent, Insurance, Internet');
// 	});

// 	it('Filter For Bill Id Array Works Correctly (5 Values)', async () => {
// 		const returnValue = await billFilterToText({
// 			db,
// 			filter: {
// 				idArray: ['Bill1', 'Bill2', 'Bill3', 'Bill4', 'Bill5']
// 			}
// 		});

// 		expect(returnValue).toHaveProperty('0', 'Is one of 5 values');
// 	});

// 	it('No filters returns expected text (Showing All)', async () => {
// 		const returnValue = await billFilterToText({
// 			db,
// 			filter: {}
// 		});

// 		expect(returnValue).toHaveProperty('0', 'Showing All');
// 	});

// 	it('Prefixes Work Correctly', async () => {
// 		const returnValue = await billFilterToText({
// 			db,
// 			filter: {
// 				title: 'Bill1'
// 			},
// 			prefix: 'Test Prefix'
// 		});

// 		expect(returnValue).toHaveProperty('0', 'Test Prefix Title contains Bill1');
// 	});
// });
