import type { CreateBillSchemaType } from '@totallator/shared';
import { billCreateInsertionData } from './billCreateInsertionData';
import { expect, describe, it, vi } from 'vitest';

describe('billCreateInsertionData', () => {
	it('should return the correct insertion data', () => {
		const data: CreateBillSchemaType = {
			status: 'active',
			title: 'test',
			importDetailId: 'importDetail1',
			importId: 'import1'
		};

		const id = '123';

		vi.useFakeTimers();
		const now = new Date();
		vi.setSystemTime(now);
		const result = billCreateInsertionData(data, id);
		vi.useRealTimers();

		const expected = {
			...data,
			id,
			updatedAt: now,
			active: true,
			disabled: false,
			allowUpdate: true
		};

		expect(result).toEqual(expected);
	});

	it('should return the correct insertion data when status is disabled', () => {
		const data: CreateBillSchemaType = {
			status: 'disabled',
			title: 'test',
			importDetailId: 'importDetail1',
			importId: 'import1'
		};

		const id = '123';

		vi.useFakeTimers();
		const now = new Date();
		vi.setSystemTime(now);
		const result = billCreateInsertionData(data, id);
		vi.useRealTimers();

		const expected = {
			...data,
			id,
			updatedAt: now,
			active: false,
			disabled: true,
			allowUpdate: true
		};

		expect(result).toEqual(expected);
	});
});
