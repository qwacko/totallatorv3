import { tagFilterToQuery, tagFilterToText } from './tagFilterToQuery';
import { tag } from '../../../postgres/schema';
import { describe, it, expect } from 'vitest';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { and } from 'drizzle-orm';
import {
	clearTestDB,
	createTestWrapper,
	getTestDB,
	initialiseTestDB
} from '$lib/server/db/test/dbTest';

describe('tagFilterToQuery', () => {
	const qb = new QueryBuilder();
	it('Filter Returns A Good Value', () => {
		const returnValue = tagFilterToQuery({
			filter: {
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
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		//Id
		expect(query.sql).toContain('"tag_materialized_view"."id" = $');
		expect(query.params).toHaveProperty('0', 'id');

		//Id Array
		expect(query.sql).toContain('"tag_materialized_view"."id" in ($');
		expect(query.params).toHaveProperty('1', 'idArray1');
		expect(query.params).toHaveProperty('2', 'idArray2');

		//Title
		expect(query.sql).toContain('"tag_materialized_view"."title" ilike $');
		expect(query.params).toHaveProperty('3', '%title%');

		//Group
		expect(query.sql).toContain('"tag_materialized_view"."group" ilike $');
		expect(query.params).toHaveProperty('4', '%group%');

		//Single
		expect(query.sql).toContain('"tag_materialized_view"."single" ilike $');
		expect(query.params).toHaveProperty('5', '%single%');

		//Status
		expect(query.sql).toContain('"tag_materialized_view"."status" = $');
		expect(query.params).toHaveProperty('6', 'active');

		//Disabled
		expect(query.sql).toContain('"tag_materialized_view"."disabled" = $');
		expect(query.params).toHaveProperty('7', false);

		//Allow Update
		expect(query.sql).toContain('"tag_materialized_view"."allow_update" = $');
		expect(query.params).toHaveProperty('8', true);

		//Active
		expect(query.sql).toContain('"tag_materialized_view"."active" = $');
		expect(query.params).toHaveProperty('9', false);

		//Import Id Array
		expect(query.sql).toContain('"tag_materialized_view"."import_id" in ($');
		expect(query.params).toHaveProperty('10', 'importId1');
		expect(query.params).toHaveProperty('11', 'importId2');

		//Import Detail Id Array
		expect(query.sql).toContain('"tag_materialized_view"."tag_import_detail_id" in ($');
		expect(query.params).toHaveProperty('12', 'importDetailId1');
		expect(query.params).toHaveProperty('13', 'importDetailId2');

		//Count Max
		expect(query.sql).toContain('"count" <= $');
		expect(query.params).toHaveProperty('14', 10);
	});

	it('Boolean Filters Work In Other Direction', () => {
		const returnValue = tagFilterToQuery({
			filter: {
				disabled: true,
				allowUpdate: false,
				active: true
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		//Disabled
		expect(query.sql).toContain('"tag_materialized_view"."disabled" = $');
		expect(query.params).toHaveProperty('0', true);

		//Allow Update
		expect(query.sql).toContain('"tag_materialized_view"."allow_update" = $');
		expect(query.params).toHaveProperty('1', false);

		//Active
		expect(query.sql).toContain('"tag_materialized_view"."active" = $');
		expect(query.params).toHaveProperty('2', true);
	});

	it('Blank Filter Returns A Blank Value', () => {
		const returnValue = tagFilterToQuery({ filter: {}, target: 'materialized' });

		const query = qb
			.select()
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('where');
	});

	it('Blank Title and ID Return A Blank Value', () => {
		const returnValue = tagFilterToQuery({
			filter: {
				id: '',
				title: ''
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('where');
	});

	it("If include summary is turned off, then count max doesn't have impact", () => {
		const returnValue = tagFilterToQuery({
			filter: {
				countMax: 10
			},
			target: 'materializedJournals'
		});

		const query = qb
			.select()
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"count" <= $');
	});

	it('Id Array is not used if the array is empty', () => {
		const returnValue = tagFilterToQuery({
			filter: {
				idArray: []
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"tag_materialized_view"."id" in ($');
	});

	it('Import Id Array is not used if the array is empty', () => {
		const returnValue = tagFilterToQuery({
			filter: {
				importIdArray: []
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"tag_materialized_view"."import_id" in ($');
	});

	it('Import Detail Id Array is not used if the array is empty', () => {
		const returnValue = tagFilterToQuery({
			filter: {
				importDetailIdArray: []
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"tag_materialized_view"."tag_import_detail_id" in ($');
	});

	it('Filtering for disabled items works correctly', () => {
		const returnValue = tagFilterToQuery({
			filter: {
				disabled: true
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).toContain('"tag_materialized_view"."disabled" = $');
		expect(query.params).toHaveProperty('0', true);
	});
});

describe('Tag Filter To Text', async () => {
	const db = await getTestDB();

	const testIT = await createTestWrapper({
		db: db.testDB,
		beforeEach: async (db, id) => {
			await clearTestDB(db);
			await initialiseTestDB({ db, tags: true, id });
		}
	});

	testIT('Filter Returns Useful Text', async (db) => {
		const returnValue = await tagFilterToText({
			db,
			filter: {
				title: 'title',
				id: 'Tag1',
				status: 'active',
				group: 'groupFilter',
				single: 'singleFilter',
				disabled: false,
				allowUpdate: true,
				active: false,
				countMax: 10
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is Personal:Home');
		expect(returnValue).toHaveProperty('1', 'Title contains title');
		expect(returnValue).toHaveProperty('2', 'Group contains groupFilter');
		expect(returnValue).toHaveProperty('3', 'Single contains singleFilter');
		expect(returnValue).toHaveProperty('4', 'Status equals active');
		expect(returnValue).toHaveProperty('5', 'Is Not Disabled');
		expect(returnValue).toHaveProperty('6', 'Can Be Updated');
		expect(returnValue).toHaveProperty('7', 'Max Journal Count of 10');
	});

	testIT('Filter For Tag Id Works Correctly', async (db) => {
		const returnValue = await tagFilterToText({
			db,
			filter: {
				id: 'Tag2'
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is Personal:Personal');
	});

	testIT('Filter For Tag Id Array Works Correctly (2 Values)', async (db) => {
		const returnValue = await tagFilterToText({
			db,
			filter: {
				idArray: ['Tag1', 'Tag2']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of Personal:Home, Personal:Personal');
	});

	testIT('Filter For Tag Id Array Works Correctly (4 Values)', async (db) => {
		const returnValue = await tagFilterToText({
			db,
			filter: {
				idArray: ['Tag1', 'Tag2', 'Tag3', 'Tag4']
			}
		});

		expect(returnValue).toHaveProperty(
			'0',
			'Is one of Personal:Home, Personal:Personal, Business A:Location A, Business A:Location B'
		);
	});

	testIT('Filter For Tag Id Array Works Correctly (5 Values)', async (db) => {
		const returnValue = await tagFilterToText({
			db,
			filter: {
				idArray: ['Tag1', 'Tag2', 'Tag3', 'Tag4', 'Tag5']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of 5 values');
	});

	testIT('No filters returns expected text (Showing All)', async (db) => {
		const returnValue = await tagFilterToText({
			db,
			filter: {}
		});

		expect(returnValue).toHaveProperty('0', 'Showing All');
	});

	testIT('Prefixes Work Correctly', async (db) => {
		const returnValue = await tagFilterToText({
			db,
			filter: {
				title: 'Tag1'
			},
			prefix: 'Test Prefix'
		});

		expect(returnValue).toHaveProperty('0', 'Test Prefix Title contains Tag1');
	});
});
