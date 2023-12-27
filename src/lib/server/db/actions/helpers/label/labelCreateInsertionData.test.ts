import type { CreateLabelSchemaType } from '$lib/schema/labelSchema';
import { labelCreateInsertionData } from './labelCreateInsertionData';
import { expect, describe, it, vi } from 'vitest';

describe('labelCreateInsertionData', () => {
	it('should return the correct insertion data', () => {
		const data: CreateLabelSchemaType = {
			status: 'active',
			title: 'test',
			importDetailId: 'importDetail1',
			importId: 'import1'
		};

		const id = '123';

		vi.useFakeTimers();
		const now = new Date();
		vi.setSystemTime(now);
		const result = labelCreateInsertionData(data, id);
		vi.useRealTimers();

		const expected = {
			...data,
			id,
			updatedAt: now.toISOString(),
			active: true,
			disabled: false,
			allowUpdate: true
		};

		expect(result).toEqual(expected);
	});

	it('should return the correct insertion data when status is disabled', () => {
		const data: CreateLabelSchemaType = {
			status: 'disabled',
			title: 'test',
			importDetailId: 'importDetail1',
			importId: 'import1'
		};

		const id = '123';

		vi.useFakeTimers();
		const now = new Date();
		vi.setSystemTime(now);
		const result = labelCreateInsertionData(data, id);
		vi.useRealTimers();

		const expected = {
			...data,
			id,
			updatedAt: now.toISOString(),
			active: false,
			disabled: true,
			allowUpdate: true
		};

		expect(result).toEqual(expected);
	});
});
