import { and } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { budget } from '@totallator/database';

import {
	clearTestDB,
	closeTestDB,
	createTestWrapper,
	getTestDB,
	initialiseTestDB
} from '@/server/db/test/dbTest';

import { budgetFilterToQuery, budgetFilterToText } from './budgetFilterToQuery';

describe('budgetFilterToQuery', () => {
	const qb = new QueryBuilder();
	it('Filter Returns A Good Value', () => {
		const returnValue = budgetFilterToQuery({
			filter: {
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
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(budget)
			.where(and(...returnValue))
			.toSQL();

		//Id
		expect(query.sql).toContain('"budget_materialized_view"."id" = $');
		expect(query.params).toHaveProperty('0', 'id');

		//Id Array
		expect(query.sql).toContain('"budget_materialized_view"."id" in ($');
		expect(query.params).toHaveProperty('1', 'idArray1');
		expect(query.params).toHaveProperty('2', 'idArray2');

		//Title
		expect(query.sql).toContain('"budget_materialized_view"."title" ilike $');
		expect(query.params).toHaveProperty('3', '%title%');

		//Status
		expect(query.sql).toContain('"budget_materialized_view"."status" = $');
		expect(query.params).toHaveProperty('4', 'active');

		//Disabled
		expect(query.sql).toContain('"budget_materialized_view"."disabled" = $');
		expect(query.params).toHaveProperty('5', false);

		//Allow Update
		expect(query.sql).toContain('"budget_materialized_view"."allow_update" = $');
		expect(query.params).toHaveProperty('6', true);

		//Active
		expect(query.sql).toContain('"budget_materialized_view"."active" = $');
		expect(query.params).toHaveProperty('7', false);

		//Import Id Array
		expect(query.sql).toContain('"budget_materialized_view"."import_id" in ($');
		expect(query.params).toHaveProperty('8', 'importId1');
		expect(query.params).toHaveProperty('9', 'importId2');

		//Import Detail Id Array
		expect(query.sql).toContain('"budget_materialized_view"."budget_import_detail_id" in ($');
		expect(query.params).toHaveProperty('10', 'importDetailId1');
		expect(query.params).toHaveProperty('11', 'importDetailId2');

		//Count Max
		expect(query.sql).toContain('"count" <= $');
		expect(query.params).toHaveProperty('12', 10.0);
	});

	it('Boolean Filters Work In Other Direction', () => {
		const returnValue = budgetFilterToQuery({
			filter: {
				disabled: true,
				allowUpdate: false,
				active: true
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(budget)
			.where(and(...returnValue))
			.toSQL();

		//Disabled
		expect(query.sql).toContain('"budget_materialized_view"."disabled" = $');
		expect(query.params).toHaveProperty('0', true);

		//Allow Update
		expect(query.sql).toContain('"budget_materialized_view"."allow_update" = $');
		expect(query.params).toHaveProperty('1', false);

		//Active
		expect(query.sql).toContain('"budget_materialized_view"."active" = $');
		expect(query.params).toHaveProperty('2', true);
	});

	it('Blank Filter Returns A Blank Value', () => {
		const returnValue = budgetFilterToQuery({
			filter: {},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(budget)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('where');
	});

	it('Blank Title and ID Return A Blank Value', () => {
		const returnValue = budgetFilterToQuery({
			filter: {
				id: '',
				title: ''
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(budget)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('where');
	});

	it("If include summary is turned off, then count max doesn't have impact", () => {
		const returnValue = budgetFilterToQuery({
			filter: {
				countMax: 10
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(budget)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"summary"."count" <= $');
	});

	it('Id Array is not used if the array is empty', () => {
		const returnValue = budgetFilterToQuery({
			filter: {
				idArray: []
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(budget)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"budget_materialized_view"."id" in ($');
	});

	it('Import Id Array is not used if the array is empty', () => {
		const returnValue = budgetFilterToQuery({
			filter: {
				importIdArray: []
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(budget)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"budget_materialized_view"."import_id" in ($');
	});

	it('Import Detail Id Array is not used if the array is empty', () => {
		const returnValue = budgetFilterToQuery({
			filter: {
				importDetailIdArray: []
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(budget)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).not.toContain('"budget_materialized_view"."budget_import_detail_id" in ($');
	});

	it('Filtering for disabled items works correctly', () => {
		const returnValue = budgetFilterToQuery({
			filter: {
				disabled: true
			},
			target: 'materialized'
		});

		const query = qb
			.select()
			.from(budget)
			.where(and(...returnValue))
			.toSQL();

		expect(query.sql).toContain('"budget_materialized_view"."disabled" = $');
		expect(query.params).toHaveProperty('0', true);
	});
});

describe('Budget Filter To Text', async () => {
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
			await initialiseTestDB({ db, budgets: true, id });
		}
	});

	testIT('Filter Returns Useful Text', async (db) => {
		const returnValue = await budgetFilterToText({
			db,
			filter: {
				title: 'title',
				id: 'Budget1',
				status: 'active',
				disabled: false,
				allowUpdate: true,
				active: false,
				countMax: 10
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is Spending');
		expect(returnValue).toHaveProperty('1', 'Title contains title');
		expect(returnValue).toHaveProperty('2', 'Status equals active');
		expect(returnValue).toHaveProperty('3', 'Is Not Disabled');
		expect(returnValue).toHaveProperty('4', 'Can Be Updated');
		expect(returnValue).toHaveProperty('5', 'Max Journal Count of 10');
	});

	testIT('Filter For Budget Id Works Correctly', async (db) => {
		const returnValue = await budgetFilterToText({
			db,
			filter: {
				id: 'Budget2'
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is Travel');
	});

	testIT('Filter For Budget Id Array Works Correctly (2 Values)', async (db) => {
		const returnValue = await budgetFilterToText({
			db,
			filter: {
				idArray: ['Budget1', 'Budget2']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of Spending, Travel');
	});

	testIT('Filter For Budget Id Array Works Correctly (4 Values)', async (db) => {
		const returnValue = await budgetFilterToText({
			db,
			filter: {
				idArray: ['Budget1', 'Budget2', 'Budget3', 'Budget4']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of Spending, Travel, Vehicle, Fun');
	});

	testIT('Filter For Budget Id Array Works Correctly (5 Values)', async (db) => {
		const returnValue = await budgetFilterToText({
			db,
			filter: {
				idArray: ['Budget1', 'Budget2', 'Budget3', 'Budget4', 'Budget5']
			}
		});

		expect(returnValue).toHaveProperty('0', 'Is one of 5 values');
	});

	testIT('No filters returns expected text (Showing All)', async (db) => {
		const returnValue = await budgetFilterToText({
			db,
			filter: {}
		});

		expect(returnValue).toHaveProperty('0', 'Showing All');
	});

	testIT('Prefixes Work Correctly', async (db) => {
		const returnValue = await budgetFilterToText({
			db,
			filter: {
				title: 'Budget1'
			},
			prefix: 'Test Prefix'
		});

		expect(returnValue).toHaveProperty('0', 'Test Prefix Title contains Budget1');
	});
});
