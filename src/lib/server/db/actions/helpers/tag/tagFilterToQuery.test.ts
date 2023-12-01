import { tagFilterToQuery, tagFilterToText } from './tagFilterToQuery';
import { tag } from '../../../schema';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { QueryBuilder } from 'drizzle-orm/sqlite-core';
import { and } from 'drizzle-orm';
import { createTestDB, initialiseTestDB, tearDownTestDB } from '$lib/server/db/test/dbTest';

describe('tagFilterToQuery', () => {
	const qb = new QueryBuilder();
	it('Filter Returns A Good Value', () => {
		const returnValue = tagFilterToQuery(
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
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		//Id
		expect(query.sql).toContain('"tag"."id" = ?');
		expect(query.params).toHaveProperty('0', 'id');

		//Id Array
		expect(query.sql).toContain('"tag"."id" in (?, ?)');
		expect(query.params).toHaveProperty('1', 'idArray1');
		expect(query.params).toHaveProperty('2', 'idArray2');

		//Title
		expect(query.sql).toContain('"tag"."title" like ?');
		expect(query.params).toHaveProperty('3', '%title%');

		//Group
		expect(query.sql).toContain('"tag"."group" ilike ?');
		expect(query.params).toHaveProperty('4', '%group%');

		//Single
		expect(query.sql).toContain('"tag"."single" ilike ?');
		expect(query.params).toHaveProperty('5', '%single%');

		//Status
		expect(query.sql).toContain('"tag"."status" = ?');
		expect(query.params).toHaveProperty('6', 'active');

		//Disabled
		expect(query.sql).toContain('"tag"."disabled" = ?');
		expect(query.params).toHaveProperty('7', 0);

		//Allow Update
		expect(query.sql).toContain('"tag"."allow_update" = ?');
		expect(query.params).toHaveProperty('8', 1);

		//Active
		expect(query.sql).toContain('"tag"."active" = ?');
		expect(query.params).toHaveProperty('9', 0);

		//Import Id Array
		expect(query.sql).toContain('"tag"."import_id" in (?, ?)');
		expect(query.params).toHaveProperty('10', 'importId1');
		expect(query.params).toHaveProperty('11', 'importId2');

		//Import Detail Id Array
		expect(query.sql).toContain('"tag"."tag_import_detail_id" in (?, ?)');
		expect(query.params).toHaveProperty('12', 'importDetailId1');
		expect(query.params).toHaveProperty('13', 'importDetailId2');

		//Count Max
		expect(query.sql).toContain('"summary"."count" <= ?');
		expect(query.params).toHaveProperty('14', 10);
	});

	it('Boolean Filters Work In Other Direction', () => {
		const returnValue = tagFilterToQuery(
			{
				disabled: true,
				allowUpdate: false,
				active: true
			},
			true
		);

		const query = qb
			.select()
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		//Disabled
		expect(query.sql).toContain('"tag"."disabled" = ?');
		expect(query.params).toHaveProperty('0', 1);

		//Allow Update
		expect(query.sql).toContain('"tag"."allow_update" = ?');
		expect(query.params).toHaveProperty('1', 0);

		//Active
		expect(query.sql).toContain('"tag"."active" = ?');
		expect(query.params).toHaveProperty('2', 1);
	});

	it('Blank Filter Returns A Blank Value', () => {
		const returnValue = tagFilterToQuery({}, true);

		const query = qb
			.select()
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('where');
	});

	it('Blank Title and ID Return A Blank Value', () => {
		const returnValue = tagFilterToQuery(
			{
				id: '',
				title: ''
			},
			true
		);

		const query = qb
			.select()
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('where');
	});

	it("If include summary is turned off, then count max doesn't have impact", () => {
		const returnValue = tagFilterToQuery(
			{
				countMax: 10
			},
			false
		);

		const query = qb
			.select()
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"summary"."count" <= ?');
	});

	it('Id Array is not used if the array is empty', () => {
		const returnValue = tagFilterToQuery(
			{
				idArray: []
			},
			false
		);

		const query = qb
			.select()
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"tag"."id" in (?, ?)');
	});

	it('Import Id Array is not used if the array is empty', () => {
		const returnValue = tagFilterToQuery(
			{
				importIdArray: []
			},
			false
		);

		const query = qb
			.select()
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"tag"."import_id" in (?, ?)');
	});

	it('Import Detail Id Array is not used if the array is empty', () => {
		const returnValue = tagFilterToQuery(
			{
				importDetailIdArray: []
			},
			false
		);

		const query = qb
			.select()
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"tag"."category_import_detail_id" in (?, ?)');
	});

	it('Filtering for disabled items works correctly', () => {
		const returnValue = tagFilterToQuery(
			{
				disabled: true
			},
			false
		);

		const query = qb
			.select()
			.from(tag)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).toContain('"tag"."disabled" = ?');
		expect(query.params).toHaveProperty('0', 1);
	});
});

describe('Tag Filter To Text', async () => {
	const { db, sqliteDatabase, filename } = await createTestDB('categoryFilterToText');

	beforeEach(async () => {
		await initialiseTestDB({ db, tags: true });
	});

	afterAll(async () => {
		await tearDownTestDB({ sqliteDatabase, filename });
	});

	it('Filter Returns Useful Text', async () => {
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

	it('Filter For Tag Id Works Correctly', async () => {
		const returnValue = await tagFilterToText({
			db,
			filter: {
				id: 'Tag2'
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is Personal:Personal');
	});

	it('Filter For Tag Id Array Works Correctly (2 Values)', async () => {
		const returnValue = await tagFilterToText({
			db,
			filter: {
				idArray: ['Tag1', 'Tag2']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of Personal:Home, Personal:Personal');
	});

	it('Filter For Tag Id Array Works Correctly (4 Values)', async () => {
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

	it('Filter For Tag Id Array Works Correctly (5 Values)', async () => {
		const returnValue = await tagFilterToText({
			db,
			filter: {
				idArray: ['Tag1', 'Tag2', 'Tag3', 'Tag4', 'Tag5']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of 5 values');
	});

	it('No filters returns expected text (Showing All)', async () => {
		const returnValue = await tagFilterToText({
			db,
			filter: {}
		});

		expect(returnValue).toHaveProperty('0', 'Showing All');
	});

	it('Prefixes Work Correctly', async () => {
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
