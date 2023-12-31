import { categoryFilterToQuery, categoryFilterToText } from './categoryFilterToQuery';
import { category } from '../../../postgres/schema';
import { describe, it, expect } from 'vitest';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { and } from 'drizzle-orm';
import {
	clearTestDB,
	createTestWrapper,
	getTestDB,
	initialiseTestDB
} from '$lib/server/db/test/dbTest';

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
		expect(query.sql).toContain('"category"."id" = $');
		expect(query.params).toHaveProperty('0', 'id');

		//Id Array
		expect(query.sql).toContain('"category"."id" in ($');
		expect(query.params).toHaveProperty('1', 'idArray1');
		expect(query.params).toHaveProperty('2', 'idArray2');

		//Title
		expect(query.sql).toContain('"category"."title" like $');
		expect(query.params).toHaveProperty('3', '%title%');

		//Group
		expect(query.sql).toContain('"category"."group" ilike $');
		expect(query.params).toHaveProperty('4', '%group%');

		//Single
		expect(query.sql).toContain('"category"."single" ilike $');
		expect(query.params).toHaveProperty('5', '%single%');

		//Status
		expect(query.sql).toContain('"category"."status" = $');
		expect(query.params).toHaveProperty('6', 'active');

		//Disabled
		expect(query.sql).toContain('"category"."disabled" = $');
		expect(query.params).toHaveProperty('7', false);

		//Allow Update
		expect(query.sql).toContain('"category"."allow_update" = $');
		expect(query.params).toHaveProperty('8', true);

		//Active
		expect(query.sql).toContain('"category"."active" = $');
		expect(query.params).toHaveProperty('9', false);

		//Import Id Array
		expect(query.sql).toContain('"category"."import_id" in ($');
		expect(query.params).toHaveProperty('10', 'importId1');
		expect(query.params).toHaveProperty('11', 'importId2');

		//Import Detail Id Array
		expect(query.sql).toContain('"category"."category_import_detail_id" in ($');
		expect(query.params).toHaveProperty('12', 'importDetailId1');
		expect(query.params).toHaveProperty('13', 'importDetailId2');

		//Count Max
		expect(query.sql).toContain('"summary"."count" <= $');
		expect(query.params).toHaveProperty('14', '10.0000');
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
		expect(query.sql).toContain('"category"."disabled" = $');
		expect(query.params).toHaveProperty('0', true);

		//Allow Update
		expect(query.sql).toContain('"category"."allow_update" = $');
		expect(query.params).toHaveProperty('1', false);

		//Active
		expect(query.sql).toContain('"category"."active" = $');
		expect(query.params).toHaveProperty('2', true);
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

		expect(query.sql).not.toContain('"summary"."count" <= $');
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

		expect(query.sql).not.toContain('"category"."id" in ($');
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

		expect(query.sql).not.toContain('"category"."import_id" in ($');
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

		expect(query.sql).not.toContain('"category"."category_import_detail_id" in ($');
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

		expect(query.sql).toContain('"category"."disabled" = $');
		expect(query.params).toHaveProperty('0', true);
	});
});

describe('Category Filter To Text', async () => {
	const db = await getTestDB();

	const testIT = await createTestWrapper({
		db: db.testDB,
		beforeEach: async (db, id) => {
			await clearTestDB(db);
			await initialiseTestDB({ db, categories: true, id });
		}
	});

	testIT('Filter Returns Useful Text', async (db) => {
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

	testIT('Filter For Category Id Works Correctly', async (db) => {
		const returnValue = await categoryFilterToText({
			db,
			filter: {
				id: 'Category2'
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is Bank:Interest');
	});

	testIT('Filter For Category Id Array Works Correctly (2 Values)', async (db) => {
		const returnValue = await categoryFilterToText({
			db,
			filter: {
				idArray: ['Category1', 'Category2']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of Bank:Fee, Bank:Interest');
	});

	testIT('Filter For Category Id Array Works Correctly (4 Values)', async (db) => {
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

	testIT('Filter For Category Id Array Works Correctly (5 Values)', async (db) => {
		const returnValue = await categoryFilterToText({
			db,
			filter: {
				idArray: ['Category1', 'Category2', 'Category3', 'Category4', 'Category5']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of 5 values');
	});

	testIT('No filters returns expected text (Showing All)', async (db) => {
		const returnValue = await categoryFilterToText({
			db,
			filter: {}
		});

		expect(returnValue).toHaveProperty('0', 'Showing All');
	});

	testIT('Prefixes Work Correctly', async (db) => {
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
