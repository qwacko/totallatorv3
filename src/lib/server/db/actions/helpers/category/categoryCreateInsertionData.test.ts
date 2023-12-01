import type { CreateCategorySchemaType } from '$lib/schema/categorySchema';

import { categoryCreateInsertionData } from './categoryCreateInsertionData';
import { expect, describe, it, vi } from 'vitest';

describe('categoryCreateInsertionData', () => {
	it('should return the correct insertion data', () => {
		const data: CreateCategorySchemaType = {
			status: 'active',
			title: 'test',
			importDetailId: 'importDetail1',
			importId: 'import1'
		};

		const id = '123';

		vi.useFakeTimers();
		const now = new Date();
		vi.setSystemTime(now);
		const result = categoryCreateInsertionData(data, id);
		vi.useRealTimers();

		const expected = {
			...data,
			group: '',
			single: 'test',
			id,
			updatedAt: now,
			active: true,
			disabled: false,
			allowUpdate: true
		};

		expect(result).toEqual(expected);
	});

	it('should return the correct insertion data when status is disabled', () => {
		const data: CreateCategorySchemaType = {
			status: 'disabled',
			title: 'test',
			importDetailId: 'importDetail1',
			importId: 'import1'
		};

		const id = '123';

		vi.useFakeTimers();
		const now = new Date();
		vi.setSystemTime(now);
		const result = categoryCreateInsertionData(data, id);
		vi.useRealTimers();

		const expected = {
			...data,
			id,
			group: '',
			single: 'test',
			updatedAt: now,
			active: false,
			disabled: true,
			allowUpdate: true
		};

		expect(result).toEqual(expected);
	});

	it('Check that title is correctly split', () => {
		const data: CreateCategorySchemaType = {
			status: 'active',
			title: 'test1:test2',
			importDetailId: 'importDetail1',
			importId: 'import1'
		};

		const id = '123';

		vi.useFakeTimers();
		const now = new Date();
		vi.setSystemTime(now);
		const result = categoryCreateInsertionData(data, id);
		vi.useRealTimers();

		const expected = {
			...data,
			id,
			group: 'test1',
			single: 'test2',
			updatedAt: now,
			active: true,
			disabled: false,
			allowUpdate: true
		};

		expect(result).toEqual(expected);
	});
});
