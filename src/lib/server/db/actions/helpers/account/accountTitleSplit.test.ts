import { describe, it, expect } from 'vitest';
import { type AccountInfo, accountTitleSplit } from './accountTitleSplit';

describe('accountTitleSplit', () => {
	it('should split the account title into account group combined and title', () => {
		const accountStr = 'Group1:Title1';
		const expected: AccountInfo = {
			accountGroupCombined: 'Group1',
			title: 'Title1'
		};

		const result = accountTitleSplit(accountStr);

		expect(result).toEqual(expected);
	});

	it('should handle account titles without a group', () => {
		const accountStr = 'Title2';
		const expected: AccountInfo = {
			accountGroupCombined: '',
			title: 'Title2'
		};

		const result = accountTitleSplit(accountStr);

		expect(result).toEqual(expected);
	});

	// Add more test cases here...
});
