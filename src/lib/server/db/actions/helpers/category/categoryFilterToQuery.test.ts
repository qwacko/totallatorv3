import { categoryFilterToQuery, categoryFilterToText } from './categoryFilterToQuery';
import { category } from '../../../schema';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { QueryBuilder } from 'drizzle-orm/sqlite-core';
import { and } from 'drizzle-orm';
import { createTestDB, initialiseTestDB, tearDownTestDB } from '$lib/server/db/test/dbTest';

describe('categoryFilterToQuery', () => {
	const qb = new QueryBuilder();
	it('Filter Returns A Good Value', () => {
		const returnValue = categoryFilterToQuery(
			{
				id: 'id',
				idArray: ['idArray1', 'idArray2'],
				title: 'title',
				group: 'group',
				single: 'single',
				status: 'active',
				disabled: false,
				allowUpdate: true,
				active: false,
				importIdArray: ['importId1', 'importId2'],
				importDetailIdArray: ['importDetailId1', 'importDetailId2'],
				countMax: 10
			},
			true
		);

		const query = qb
			.select()
			.from(category)
			.where(and(...returnValue))
			.toSQL();

		//Id
		expect(query.sql).toContain('"category"."id" = ?');
		expect(query.params).toHaveProperty('0', 'id');

		//Id Array
		expect(query.sql).toContain('"category"."id" in (?, ?)');
		expect(query.params).toHaveProperty('1', 'idArray1');
		expect(query.params).toHaveProperty('2', 'idArray2');

		//Title
		expect(query.sql).toContain('"category"."title" like ?');
		expect(query.params).toHaveProperty('3', '%title%');

		//Group
		expect(query.sql).toContain('"category"."group" ilike ?');
		expect(query.params).toHaveProperty('4', '%group%');

		//Single
		expect(query.sql).toContain('"category"."single" ilike ?');
		expect(query.params).toHaveProperty('5', '%single%');

		//Status
		expect(query.sql).toContain('"category"."status" = ?');
		expect(query.params).toHaveProperty('6', 'active');

		//Disabled
		expect(query.sql).toContain('"category"."disabled" = ?');
		expect(query.params).toHaveProperty('7', 0);

		//Allow Update
		expect(query.sql).toContain('"category"."allow_update" = ?');
		expect(query.params).toHaveProperty('8', 1);

		//Active
		expect(query.sql).toContain('"category"."active" = ?');
		expect(query.params).toHaveProperty('9', 0);

		//Import Id Array
		expect(query.sql).toContain('"category"."import_id" in (?, ?)');
		expect(query.params).toHaveProperty('10', 'importId1');
		expect(query.params).toHaveProperty('11', 'importId2');

		//Import Detail Id Array
		expect(query.sql).toContain('"category"."category_import_detail_id" in (?, ?)');
		expect(query.params).toHaveProperty('12', 'importDetailId1');
		expect(query.params).toHaveProperty('13', 'importDetailId2');

		//Count Max
		expect(query.sql).toContain('"summary"."count" <= ?');
		expect(query.params).toHaveProperty('14', 10);
	});

	it('Boolean Filters Work In Other Direction', () => {
		const returnValue = categoryFilterToQuery(
			{
				disabled: true,
				allowUpdate: false,
				active: true
			},
			true
		);

		const query = qb
			.select()
			.from(category)
			.where(and(...returnValue))
			.toSQL();

		//Disabled
		expect(query.sql).toContain('"category"."disabled" = ?');
		expect(query.params).toHaveProperty('0', 1);

		//Allow Update
		expect(query.sql).toContain('"category"."allow_update" = ?');
		expect(query.params).toHaveProperty('1', 0);

		//Active
		expect(query.sql).toContain('"category"."active" = ?');
		expect(query.params).toHaveProperty('2', 1);
	});

	it('Blank Filter Returns A Blank Value', () => {
		const returnValue = categoryFilterToQuery({}, true);

		const query = qb
			.select()
			.from(category)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('where');
	});

	it('Blank Title and ID Return A Blank Value', () => {
		const returnValue = categoryFilterToQuery(
			{
				id: '',
				title: ''
			},
			true
		);

		const query = qb
			.select()
			.from(category)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('where');
	});

	it("If include summary is turned off, then count max doesn't have impact", () => {
		const returnValue = categoryFilterToQuery(
			{
				countMax: 10
			},
			false
		);

		const query = qb
			.select()
			.from(category)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"summary"."count" <= ?');
	});

	it('Id Array is not used if the array is empty', () => {
		const returnValue = categoryFilterToQuery(
			{
				idArray: []
			},
			false
		);

		const query = qb
			.select()
			.from(category)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"category"."id" in (?, ?)');
	});

	it('Import Id Array is not used if the array is empty', () => {
		const returnValue = categoryFilterToQuery(
			{
				importIdArray: []
			},
			false
		);

		const query = qb
			.select()
			.from(category)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"category"."import_id" in (?, ?)');
	});

	it('Import Detail Id Array is not used if the array is empty', () => {
		const returnValue = categoryFilterToQuery(
			{
				importDetailIdArray: []
			},
			false
		);

		const query = qb
			.select()
			.from(category)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"category"."category_import_detail_id" in (?, ?)');
	});

	it('Filtering for disabled items works correctly', () => {
		const returnValue = categoryFilterToQuery(
			{
				disabled: true
			},
			false
		);

		const query = qb
			.select()
			.from(category)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).toContain('"category"."disabled" = ?');
		expect(query.params).toHaveProperty('0', 1);
	});
});

describe('Category Filter To Text', async () => {
	const { db, sqliteDatabase, filename } = await createTestDB('categoryFilterToText');

	beforeEach(async () => {
		await initialiseTestDB({ db, categories: true });
	});

	afterAll(async () => {
		await tearDownTestDB({ sqliteDatabase, filename });
	});

	it('Filter Returns Useful Text', async () => {
		const returnValue = await categoryFilterToText({
			db,
			filter: {
				title: 'title',
				id: 'Category1',
				status: 'active',
				group: 'groupFilter',
				single: 'singleFilter',
				disabled: false,
				allowUpdate: true,
				active: false,
				countMax: 10
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is Bank:Fee');
		expect(returnValue).toHaveProperty('1', 'Title contains title');
		expect(returnValue).toHaveProperty('2', 'Group contains groupFilter');
		expect(returnValue).toHaveProperty('3', 'Single contains singleFilter');
		expect(returnValue).toHaveProperty('4', 'Status equals active');
		expect(returnValue).toHaveProperty('5', 'Is Not Disabled');
		expect(returnValue).toHaveProperty('6', 'Can Be Updated');
		expect(returnValue).toHaveProperty('7', 'Max Journal Count of 10');
	});

	it('Filter For Category Id Works Correctly', async () => {
		const returnValue = await categoryFilterToText({
			db,
			filter: {
				id: 'Category2'
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is Bank:Interest');
	});

	it('Filter For Category Id Array Works Correctly (2 Values)', async () => {
		const returnValue = await categoryFilterToText({
			db,
			filter: {
				idArray: ['Category1', 'Category2']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of Bank:Fee, Bank:Interest');
	});

	it('Filter For Category Id Array Works Correctly (4 Values)', async () => {
		const returnValue = await categoryFilterToText({
			db,
			filter: {
				idArray: ['Category1', 'Category2', 'Category3', 'Category4']
			}
		});

		expect(returnValue).toHaveProperty(
			'0',
			'Is one of Bank:Fee, Bank:Interest, Food:Groceries, Food:Restaurants'
		);
	});

	it('Filter For Category Id Array Works Correctly (5 Values)', async () => {
		const returnValue = await categoryFilterToText({
			db,
			filter: {
				idArray: ['Category1', 'Category2', 'Category3', 'Category4', 'Category5']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of 5 values');
	});

	it('No filters returns expected text (Showing All)', async () => {
		const returnValue = await categoryFilterToText({
			db,
			filter: {}
		});

		expect(returnValue).toHaveProperty('0', 'Showing All');
	});

	it('Prefixes Work Correctly', async () => {
		const returnValue = await categoryFilterToText({
			db,
			filter: {
				title: 'Category1'
			},
			prefix: 'Test Prefix'
		});

		expect(returnValue).toHaveProperty('0', 'Test Prefix Title contains Category1');
	});
});
