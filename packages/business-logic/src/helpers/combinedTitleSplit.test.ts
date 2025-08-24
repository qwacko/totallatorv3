import { describe, expect, it } from 'vitest';

import { combinedTitleSplit, combinedTitleSplitRequired } from './combinedTitleSplit';

// Adjust the import path

describe('combinedTitleSplitRequired', () => {
	it('should split title into group and single', () => {
		const result = combinedTitleSplitRequired({ title: 'Group:Single' });
		expect(result).toEqual({
			title: 'Group:Single',
			group: 'Group',
			single: 'Single'
		});
	});

	it('should handle title with no colon', () => {
		const result = combinedTitleSplitRequired({ title: 'Group' });
		expect(result).toEqual({
			title: 'Group',
			group: '',
			single: 'Group'
		});
	});

	it('should handle empty title', () => {
		const result = combinedTitleSplitRequired({ title: '' });
		expect(result).toEqual({
			title: '',
			group: '',
			single: ''
		});
	});
});

describe('combinedTitleSplit', () => {
	it('should return split title when title is provided', () => {
		const result = combinedTitleSplit({ title: 'Group:Single' });
		expect(result).toEqual({
			title: 'Group:Single',
			group: 'Group',
			single: 'Single'
		});
	});

	it('should return empty object when title is undefined', () => {
		const result = combinedTitleSplit({});
		expect(result).toEqual({});
	});

	it('should handle empty title', () => {
		//@ts-expect-error - intentionally passing in empty string
		const result = combinedTitleSplit({ group: 'this' });
		expect(result).toEqual({});
	});

	// Add more tests as needed for other scenarios and edge cases
});
