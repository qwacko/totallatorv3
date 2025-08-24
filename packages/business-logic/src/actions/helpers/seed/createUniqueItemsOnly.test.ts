import { describe, expect, it } from 'vitest';

import { createUniqueItemsOnly } from './createUniqueItemsOnly';

describe('createUniqueItemsOnly', () => {
	it('should return an array of unique items', () => {
		const existing = ['item1', 'item2', 'item3'];
		const count = 5;
		const createItem = () => ({ id: Math.random().toString() });
		const creationToString = (creation: { id: string }) => creation.id;

		const result = createUniqueItemsOnly({
			existing,
			count,
			createItem,
			creationToString
		});

		expect(result).toHaveLength(count);
		expect(result.every((item) => existing.indexOf(creationToString(item)) === -1)).toBe(true);
	});

	it('should return an empty array when count is 0', () => {
		const existing = ['item1', 'item2', 'item3'];
		const count = 0;
		const createItem = () => ({ id: Math.random().toString() });
		const creationToString = (creation: { id: string }) => creation.id;

		const result = createUniqueItemsOnly({
			existing,
			count,
			createItem,
			creationToString
		});

		expect(result).toHaveLength(0);
	});
});
