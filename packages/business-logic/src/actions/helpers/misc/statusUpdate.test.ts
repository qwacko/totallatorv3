import { describe, expect, it } from 'vitest';

import { statusUpdate } from './statusUpdate';

describe('statusUpdate', () => {
	it('should return an empty object when status is undefined', () => {
		const result = statusUpdate(undefined);
		expect(result).toEqual({});
	});

	it('should return the correct object when status is active', () => {
		const result = statusUpdate('active');
		expect(result).toEqual({
			status: 'active',
			active: true,
			disabled: false,
			allowUpdate: true
		});
	});

	it('should return the correct object when status is disabled', () => {
		const result = statusUpdate('disabled');
		expect(result).toEqual({
			status: 'disabled',
			active: false,
			disabled: true,
			allowUpdate: true
		});
	});

	it('should throw an error if the status is neither active nor disabled', () => {
		//@ts-expect-error - Testing invalid status
		expect(() => statusUpdate('other')).toThrow('Invalid status provided.');
	});
});
