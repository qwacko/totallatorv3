import type { CreateBudgetSchemaType } from '@totallator/shared';

import { budgetCreateInsertionData } from './budgetCreateInsertionData';
import { expect, describe, it, vi } from 'vitest';

describe('budgetCreateInsertionData', () => {
	it('should return the correct insertion data', () => {
		const data: CreateBudgetSchemaType = {
			status: 'active',
			title: 'test',
			importDetailId: 'importDetail1',
			importId: 'import1'
		};

		const id = '123';

		vi.useFakeTimers();
		const now = new Date();
		vi.setSystemTime(now);
		const result = budgetCreateInsertionData(data, id);
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
		const data: CreateBudgetSchemaType = {
			status: 'disabled',
			title: 'test',
			importDetailId: 'importDetail1',
			importId: 'import1'
		};

		const id = '123';

		vi.useFakeTimers();
		const now = new Date();
		vi.setSystemTime(now);
		const result = budgetCreateInsertionData(data, id);
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
