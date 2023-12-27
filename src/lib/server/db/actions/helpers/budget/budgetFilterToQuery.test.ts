import { budgetFilterToQuery, budgetFilterToText } from './budgetFilterToQuery';
import { budget } from '../../../postgres/schema';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { and } from 'drizzle-orm';
import { clearTestDB, createTestWrapper, getTestDB, initialiseTestDB, } from '$lib/server/db/test/dbTest';

describe('budgetFilterToQuery', () => {
    const qb = new QueryBuilder();
    it('Filter Returns A Good Value', () => {
        const returnValue = budgetFilterToQuery(
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
            .from(budget)
            .where(and(...returnValue))
            .toSQL();

        //Id
        expect(query.sql).toContain('"budget"."id" = $');
        expect(query.params).toHaveProperty('0', 'id');

        //Id Array
        expect(query.sql).toContain('"budget"."id" in ($');
        expect(query.params).toHaveProperty('1', 'idArray1');
        expect(query.params).toHaveProperty('2', 'idArray2');

        //Title
        expect(query.sql).toContain('"budget"."title" like $');
        expect(query.params).toHaveProperty('3', '%title%');

        //Status
        expect(query.sql).toContain('"budget"."status" = $');
        expect(query.params).toHaveProperty('4', 'active');

        //Disabled
        expect(query.sql).toContain('"budget"."disabled" = $');
        expect(query.params).toHaveProperty('5', false);

        //Allow Update
        expect(query.sql).toContain('"budget"."allow_update" = $');
        expect(query.params).toHaveProperty('6', true);

        //Active
        expect(query.sql).toContain('"budget"."active" = $');
        expect(query.params).toHaveProperty('7', false);

        //Import Id Array
        expect(query.sql).toContain('"budget"."import_id" in ($');
        expect(query.params).toHaveProperty('8', 'importId1');
        expect(query.params).toHaveProperty('9', 'importId2');

        //Import Detail Id Array
        expect(query.sql).toContain('"budget"."budget_import_detail_id" in ($');
        expect(query.params).toHaveProperty('10', 'importDetailId1');
        expect(query.params).toHaveProperty('11', 'importDetailId2');

        //Count Max
        expect(query.sql).toContain('"summary"."count" <= $');
        expect(query.params).toHaveProperty('12', 10);
    });

    it('Boolean Filters Work In Other Direction', () => {
        const returnValue = budgetFilterToQuery(
            {
                disabled: true,
                allowUpdate: false,
                active: true
            },
            true
        );

        const query = qb
            .select()
            .from(budget)
            .where(and(...returnValue))
            .toSQL();

        //Disabled
        expect(query.sql).toContain('"budget"."disabled" = $');
        expect(query.params).toHaveProperty('0', true);

        //Allow Update
        expect(query.sql).toContain('"budget"."allow_update" = $');
        expect(query.params).toHaveProperty('1', false);

        //Active
        expect(query.sql).toContain('"budget"."active" = $');
        expect(query.params).toHaveProperty('2', true);
    });

    it('Blank Filter Returns A Blank Value', () => {
        const returnValue = budgetFilterToQuery({}, true);

        const query = qb
            .select()
            .from(budget)
            .where(and(...returnValue))
            .toSQL();

        expect(query.sql).not.toContain('where');
    });

    it('Blank Title and ID Return A Blank Value', () => {
        const returnValue = budgetFilterToQuery(
            {
                id: '',
                title: ''
            },
            true
        );

        const query = qb
            .select()
            .from(budget)
            .where(and(...returnValue))
            .toSQL();

        expect(query.sql).not.toContain('where');
    });

    it("If include summary is turned off, then count max doesn't have impact", () => {
        const returnValue = budgetFilterToQuery(
            {
                countMax: 10
            },
            false
        );

        const query = qb
            .select()
            .from(budget)
            .where(and(...returnValue))
            .toSQL();

        expect(query.sql).not.toContain('"summary"."count" <= $');
    });

    it('Id Array is not used if the array is empty', () => {
        const returnValue = budgetFilterToQuery(
            {
                idArray: []
            },
            false
        );

        const query = qb
            .select()
            .from(budget)
            .where(and(...returnValue))
            .toSQL();

        expect(query.sql).not.toContain('"budget"."id" in ($');
    });

    it('Import Id Array is not used if the array is empty', () => {
        const returnValue = budgetFilterToQuery(
            {
                importIdArray: []
            },
            false
        );

        const query = qb
            .select()
            .from(budget)
            .where(and(...returnValue))
            .toSQL();

        expect(query.sql).not.toContain('"budget"."import_id" in ($');
    });

    it('Import Detail Id Array is not used if the array is empty', () => {
        const returnValue = budgetFilterToQuery(
            {
                importDetailIdArray: []
            },
            false
        );

        const query = qb
            .select()
            .from(budget)
            .where(and(...returnValue))
            .toSQL();

        expect(query.sql).not.toContain('"budget"."budget_import_detail_id" in ($');
    });

    it('Filtering for disabled items works correctly', () => {
        const returnValue = budgetFilterToQuery(
            {
                disabled: true
            },
            false
        );

        const query = qb
            .select()
            .from(budget)
            .where(and(...returnValue))
            .toSQL();

        expect(query.sql).toContain('"budget"."disabled" = $');
        expect(query.params).toHaveProperty('0', true);
    });
});

describe('Budget Filter To Text', async () => {
    const db = await getTestDB();

    const testIT = await createTestWrapper({
        db: db.testDB,
        beforeEach: async (db, id) => {
            await clearTestDB(db);
            await initialiseTestDB({ db, budgets: true, id });

        }
    })

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
