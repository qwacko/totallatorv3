import { describe, it, expect } from 'vitest';
import { combinedAccountTitleSplitRequired } from './combinedAccountTitleSplit'; // Adjust the import path

describe('combinedAccountTitleSplitRequired', () => {
	it('should handle empty accountGroupCombined', () => {
		const result = combinedAccountTitleSplitRequired({
			title: 'Sample Title',
			accountGroupCombined: ''
		});
		expect(result).toEqual({
			title: 'Sample Title',
			accountGroup: '',
			accountGroup2: '',
			accountGroup3: '',
			accountGroupCombined: '',
			accountTitleCombined: 'Sample Title'
		});
	});

	it('should split accountGroupCombined into three parts', () => {
		const result = combinedAccountTitleSplitRequired({
			title: 'Title',
			accountGroupCombined: 'Group1:Group2:Group3'
		});
		expect(result).toEqual({
			title: 'Title',
			accountGroup: 'Group1',
			accountGroup2: 'Group2',
			accountGroup3: 'Group3',
			accountGroupCombined: 'Group1:Group2:Group3',
			accountTitleCombined: 'Group1:Group2:Group3:Title'
		});
	});

	it('should handle accountGroupCombined with less than three parts', () => {
		const result = combinedAccountTitleSplitRequired({
			title: 'Title',
			accountGroupCombined: 'Group1:Group2'
		});
		expect(result).toEqual({
			title: 'Title',
			accountGroup: 'Group1',
			accountGroup2: 'Group2',
			accountGroup3: '',
			accountGroupCombined: 'Group1:Group2',
			accountTitleCombined: 'Group1:Group2:Title'
		});
	});

	it('should handle accountGroupCombined with only one part', () => {
		const result = combinedAccountTitleSplitRequired({
			title: 'Title',
			accountGroupCombined: 'Group1'
		});
		expect(result).toEqual({
			title: 'Title',
			accountGroup: 'Group1',
			accountGroup2: '',
			accountGroup3: '',
			accountGroupCombined: 'Group1',
			accountTitleCombined: 'Group1:Title'
		});
	});
});
