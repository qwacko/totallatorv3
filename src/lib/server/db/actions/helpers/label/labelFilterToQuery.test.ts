import { labelFilterToQuery, labelFilterToText } from './labelFilterToQuery';
import { label } from '../../../postgres/schema';
import { describe, it, expect } from 'vitest';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { and } from 'drizzle-orm';
import {
	clearTestDB,
	createTestWrapper,
	getTestDB,
	initialiseTestDB
} from '$lib/server/db/test/dbTest';

describe('labelFilterToQuery', () => {
	const qb = new QueryBuilder();
	it('Filter Returns A Good Value', () => {
		const returnValue = labelFilterToQuery(
			{
				id: 'id',
				idArray: ['idArray1', 'idArray2'],
				title: 'title',
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
			.from(label)
			.where(and(...returnValue))
			.toSQL();

		//Id
		expect(query.sql).toContain('"label_materialized_view"."id" = $');
		expect(query.params).toHaveProperty('0', 'id');

		//Id Array
		expect(query.sql).toContain('"label_materialized_view"."id" in ($');
		expect(query.params).toHaveProperty('1', 'idArray1');
		expect(query.params).toHaveProperty('2', 'idArray2');

		//Title
		expect(query.sql).toContain('"label_materialized_view"."title" ilike $');
		expect(query.params).toHaveProperty('3', '%title%');

		//Status
		expect(query.sql).toContain('"label_materialized_view"."status" = $');
		expect(query.params).toHaveProperty('4', 'active');

		//Disabled
		expect(query.sql).toContain('"label_materialized_view"."disabled" = $');
		expect(query.params).toHaveProperty('5', false);

		//Allow Update
		expect(query.sql).toContain('"label_materialized_view"."allow_update" = $');
		expect(query.params).toHaveProperty('6', true);

		//Active
		expect(query.sql).toContain('"label_materialized_view"."active" = $');
		expect(query.params).toHaveProperty('7', false);

		//Import Id Array
		expect(query.sql).toContain('"label_materialized_view"."import_id" in ($');
		expect(query.params).toHaveProperty('8', 'importId1');
		expect(query.params).toHaveProperty('9', 'importId2');

		//Import Detail Id Array
		expect(query.sql).toContain('"label_materialized_view"."label_import_detail_id" in ($');
		expect(query.params).toHaveProperty('10', 'importDetailId1');
		expect(query.params).toHaveProperty('11', 'importDetailId2');

		//Count Max
		expect(query.sql).toContain('"count" <= $');
		expect(query.params).toHaveProperty('12', 10);
	});

	it('Boolean Filters Work In Other Direction', () => {
		const returnValue = labelFilterToQuery(
			{
				disabled: true,
				allowUpdate: false,
				active: true
			},
			true
		);

		const query = qb
			.select()
			.from(label)
			.where(and(...returnValue))
			.toSQL();

		//Disabled
		expect(query.sql).toContain('"label_materialized_view"."disabled" = $');
		expect(query.params).toHaveProperty('0', true);

		//Allow Update
		expect(query.sql).toContain('"label_materialized_view"."allow_update" = $');
		expect(query.params).toHaveProperty('1', false);

		//Active
		expect(query.sql).toContain('"label_materialized_view"."active" = $');
		expect(query.params).toHaveProperty('2', true);
	});

	it('Blank Filter Returns A Blank Value', () => {
		const returnValue = labelFilterToQuery({}, true);

		const query = qb
			.select()
			.from(label)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('where');
	});

	it('Blank Title and ID Return A Blank Value', () => {
		const returnValue = labelFilterToQuery(
			{
				id: '',
				title: ''
			},
			true
		);

		const query = qb
			.select()
			.from(label)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('where');
	});

	it("If include summary is turned off, then count max doesn't have impact", () => {
		const returnValue = labelFilterToQuery(
			{
				countMax: 10
			},
			false
		);

		const query = qb
			.select()
			.from(label)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"summary"."count" <= $');
	});

	it('Id Array is not used if the array is empty', () => {
		const returnValue = labelFilterToQuery(
			{
				idArray: []
			},
			false
		);

		const query = qb
			.select()
			.from(label)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"label_materialized_view"."id" in ($');
	});

	it('Import Id Array is not used if the array is empty', () => {
		const returnValue = labelFilterToQuery(
			{
				importIdArray: []
			},
			false
		);

		const query = qb
			.select()
			.from(label)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"label_materialized_view"."import_id" in ($');
	});

	it('Import Detail Id Array is not used if the array is empty', () => {
		const returnValue = labelFilterToQuery(
			{
				importDetailIdArray: []
			},
			false
		);

		const query = qb
			.select()
			.from(label)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"label_materialized_view"."label_import_detail_id" in ($');
	});

	it('Filtering for disabled items works correctly', () => {
		const returnValue = labelFilterToQuery(
			{
				disabled: true
			},
			false
		);

		const query = qb
			.select()
			.from(label)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).toContain('"label_materialized_view"."disabled" = $');
		expect(query.params).toHaveProperty('0', true);
	});
});

describe('Label Filter To Text', async () => {
	const db = await getTestDB();

	const testIT = await createTestWrapper({
		db: db.testDB,
		beforeEach: async (db, id) => {
			await clearTestDB(db);
			await initialiseTestDB({ db, labels: true, id });
		}
	});

	testIT('Filter Returns Useful Text', async (db) => {
		const returnValue = await labelFilterToText({
			db,
			filter: {
				title: 'title',
				id: 'Label1',
				status: 'active',
				disabled: false,
				allowUpdate: true,
				active: false,
				countMax: 10
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is Label 1');
		expect(returnValue).toHaveProperty('1', 'Title contains title');
		expect(returnValue).toHaveProperty('2', 'Status equals active');
		expect(returnValue).toHaveProperty('3', 'Is Not Disabled');
		expect(returnValue).toHaveProperty('4', 'Can Be Updated');
		expect(returnValue).toHaveProperty('5', 'Max Journal Count of 10');
	});

	testIT('Filter For Label Id Works Correctly', async (db) => {
		const returnValue = await labelFilterToText({
			db,
			filter: {
				id: 'Label2'
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is Label 2');
	});

	testIT('Filter For Label Id Array Works Correctly (2 Values)', async (db) => {
		const returnValue = await labelFilterToText({
			db,
			filter: {
				idArray: ['Label1', 'Label2']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of Label 1, Label 2');
	});

	testIT('Filter For Label Id Array Works Correctly (4 Values)', async (db) => {
		const returnValue = await labelFilterToText({
			db,
			filter: {
				idArray: ['Label1', 'Label2', 'Label3', 'Label4']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of Label 1, Label 2, Label 3, Label 4');
	});

	testIT('Filter For Label Id Array Works Correctly (5 Values)', async (db) => {
		const returnValue = await labelFilterToText({
			db,
			filter: {
				idArray: ['Label1', 'Label2', 'Label3', 'Label4', 'Label5']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of 5 values');
	});

	testIT('No filters returns expected text (Showing All)', async (db) => {
		const returnValue = await labelFilterToText({
			db,
			filter: {}
		});

		expect(returnValue).toHaveProperty('0', 'Showing All');
	});

	testIT('Prefixes Work Correctly', async (db) => {
		const returnValue = await labelFilterToText({
			db,
			filter: {
				title: 'Label1'
			},
			prefix: 'Test Prefix'
		});

		expect(returnValue).toHaveProperty('0', 'Test Prefix Title contains Label1');
	});
});
