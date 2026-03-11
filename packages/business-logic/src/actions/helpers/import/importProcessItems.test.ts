import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { importProcessItems } from './importProcessItems';

const insertedRows: any[] = [];

vi.mock('@totallator/context', () => ({
	getContextDB: () => ({
		insert: () => ({
			values: (value: any) => ({ value })
		})
	})
}));

vi.mock('@/server/db/dbLogger', () => ({
	dbExecuteLogger: async (query: { value: any }) => {
		insertedRows.push(query.value);
		return [];
	}
}));

let nanoIdCounter = 0;
vi.mock('nanoid', () => ({
	nanoid: () => `import-detail-${++nanoIdCounter}`
}));

describe('importProcessItems', () => {
	beforeEach(() => {
		insertedRows.length = 0;
		nanoIdCounter = 0;
	});

	it('marks duplicate rows within a single file using the same unique identifier', async () => {
		await importProcessItems({
			id: 'import-1',
			data: {
				data: [
					{ id: 'abc', title: 'First Title' },
					{ id: 'abc', title: 'Second Title' }
				]
			},
			schema: z.object({ id: z.string(), title: z.string() }),
			getUniqueIdentifier: (data) => `id:${data.id}`
		});

		expect(insertedRows).toHaveLength(2);
		expect(insertedRows[0].status).toBe('processed');
		expect(insertedRows[0].uniqueId).toBe('id:abc');
		expect(insertedRows[1].status).toBe('duplicate');
		expect(insertedRows[1].uniqueId).toBe('id:abc');
	});

	it('stores flattened zod errors for invalid rows', async () => {
		await importProcessItems({
			id: 'import-2',
			data: {
				data: [{ title: 'x' }]
			},
			schema: z.object({
				title: z.string().min(3),
				amount: z.number()
			})
		});

		expect(insertedRows).toHaveLength(1);
		expect(insertedRows[0].status).toBe('error');
		expect(insertedRows[0].errorInfo.errors).toEqual(
			expect.arrayContaining([expect.stringContaining('title:'), expect.stringContaining('amount:')])
		);
	});
});
