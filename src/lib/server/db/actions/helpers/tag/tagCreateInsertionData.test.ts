import type { CreateTagSchemaType } from '$lib/schema/tagSchema';

import { tagCreateInsertionData } from './tagCreateInsertionData';
import { expect, describe, it, vi } from 'vitest';

describe('tagCreateInsertionData', () => {
	it('should return the correct insertion data', () => {
		const data: CreateTagSchemaType = {
			status: 'active',
			title: 'test',
			importDetailId: 'importDetail1',
			importId: 'import1'
		};

		const id = '123';

		vi.useFakeTimers();
		const now = new Date();
		vi.setSystemTime(now);
		const result = tagCreateInsertionData(data, id);
		vi.useRealTimers();

		const expected = {
			...data,
			group: '',
			single: 'test',
			id,
			updatedAt: now.toISOString(),
			active: true,
			disabled: false,
			allowUpdate: true
		};

		expect(result).toEqual(expected);
	});

	it('should return the correct insertion data when status is disabled', () => {
		const data: CreateTagSchemaType = {
			status: 'disabled',
			title: 'test',
			importDetailId: 'importDetail1',
			importId: 'import1'
		};

		const id = '123';

		vi.useFakeTimers();
		const now = new Date();
		vi.setSystemTime(now);
		const result = tagCreateInsertionData(data, id);
		vi.useRealTimers();

		const expected = {
			...data,
			id,
			group: '',
			single: 'test',
			updatedAt: now.toISOString(),
			active: false,
			disabled: true,
			allowUpdate: true
		};

		expect(result).toEqual(expected);
	});

	it('Check that title is correctly split', () => {
		const data: CreateTagSchemaType = {
			status: 'active',
			title: 'test1:test2',
			importDetailId: 'importDetail1',
			importId: 'import1'
		};

		const id = '123';

		vi.useFakeTimers();
		const now = new Date();
		vi.setSystemTime(now);
		const result = tagCreateInsertionData(data, id);
		vi.useRealTimers();

		const expected = {
			...data,
			id,
			group: 'test1',
			single: 'test2',
			updatedAt: now.toISOString(),
			active: true,
			disabled: false,
			allowUpdate: true
		};

		expect(result).toEqual(expected);
	});
});
