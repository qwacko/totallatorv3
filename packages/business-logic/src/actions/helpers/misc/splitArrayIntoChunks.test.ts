import { describe, expect, it } from 'vitest';

import { splitArrayIntoChunks } from './splitArrayIntoChunks';

describe('splitArrayIntoChunks', () => {
	it('should split an array into chunks', () => {
		const array = [1, 2, 3, 4, 5, 6, 7, 8];
		const chunkSize = 3;

		const result = splitArrayIntoChunks(array, chunkSize);

		expect(result).toEqual([
			[1, 2, 3],
			[4, 5, 6],
			[7, 8]
		]);
	});

	it('should split an array into chunks when the array is not divisible by the chunk size', () => {
		const array = [1, 2, 3, 4, 5, 6, 7, 8];
		const chunkSize = 4;

		const result = splitArrayIntoChunks(array, chunkSize);

		expect(result).toEqual([
			[1, 2, 3, 4],
			[5, 6, 7, 8]
		]);
	});

	it('should split an array into chunks when the array is not divisible by the chunk size and the chunk size is larger than the array', () => {
		const array = [1, 2, 3, 4, 5, 6, 7, 8];
		const chunkSize = 10;

		const result = splitArrayIntoChunks(array, chunkSize);

		expect(result).toEqual([[1, 2, 3, 4, 5, 6, 7, 8]]);
	});
});
