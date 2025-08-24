import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { accountCreateInsertionData } from './accountCreateInsertionData';

describe('accountCreateInsertionData', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should return the correct data for asset / liability', () => {
		const date = new Date(2020, 1, 1, 1, 0, 0, 0);
		vi.setSystemTime(date);

		const types = ['asset', 'liability'] as const;

		types.forEach((type) => {
			const id = '123';

			const returnData = accountCreateInsertionData(
				{
					title: 'Test Account',
					type,
					accountGroupCombined: 'Group1:Group2:Group3',
					status: 'active',
					startDate: '2020-02-02',
					endDate: '2021-01-01'
				},
				id
			);

			expect(returnData).toEqual({
				id: '123',
				title: 'Test Account',
				type,
				accountGroup: 'Group1',
				accountGroup2: 'Group2',
				accountGroup3: 'Group3',
				accountGroupCombined: 'Group1:Group2:Group3',
				accountTitleCombined: 'Group1:Group2:Group3:Test Account',
				status: 'active',
				updatedAt: date,
				active: true,
				allowUpdate: true,
				disabled: false,
				startDate: '2020-02-02',
				endDate: '2021-01-01'
			});
		});
	});

	it('should return the correct data for income / expense', () => {
		const date = new Date(2020, 1, 1, 1, 0, 0, 0);
		vi.setSystemTime(date);

		const types = ['income', 'expense'] as const;

		types.forEach((type) => {
			const id = '123';

			const returnData = accountCreateInsertionData(
				{
					title: 'Test Account',
					type,
					accountGroupCombined: 'Group1:Group2:Group3',
					status: 'active',
					isCash: true,
					isNetWorth: true,
					startDate: new Date().toISOString().slice(0, 10),
					endDate: new Date().toISOString().slice(0, 10)
				},
				id
			);

			expect(returnData).toEqual({
				id: '123',
				title: 'Test Account',
				type,
				accountGroup: '',
				accountGroup2: '',
				accountGroup3: '',
				accountGroupCombined: '',
				accountTitleCombined: 'Test Account',
				status: 'active',
				updatedAt: date,
				active: true,
				allowUpdate: true,
				disabled: false,
				isCash: false,
				isNetWorth: false,
				startDate: null,
				endDate: null
			});
		});
	});

	it('Setting Status should correctly set the disabled etc...', () => {
		const date = new Date(2020, 1, 1, 1, 0, 0, 0);
		vi.setSystemTime(date);

		const id = '123';

		const returnData = accountCreateInsertionData(
			{
				title: 'Test Account',
				type: 'asset',
				accountGroupCombined: 'Group1:Group2:Group3',
				status: 'disabled'
			},
			id
		);

		expect(returnData).toEqual({
			id: '123',
			title: 'Test Account',
			type: 'asset',
			accountGroup: 'Group1',
			accountGroup2: 'Group2',
			accountGroup3: 'Group3',
			accountGroupCombined: 'Group1:Group2:Group3',
			accountTitleCombined: 'Group1:Group2:Group3:Test Account',
			status: 'disabled',
			updatedAt: date,
			active: false,
			allowUpdate: true,
			disabled: true
		});
	});

	it('Incorrect Start Date Should Produce An Error', () => {
		const id = '123';

		expect(() => {
			accountCreateInsertionData(
				{
					title: 'Test Account',
					type: 'asset',
					accountGroupCombined: 'Group1:Group2:Group3',
					status: 'active',
					startDate: '2020-14-02',
					endDate: '2021-01-01'
				},
				id
			);
		}).toThrowError('Start date is not a valid date');
	});

	it('Incorrect End Date Should Produce An Error', () => {
		const id = '123';

		expect(() => {
			accountCreateInsertionData(
				{
					title: 'Test Account',
					type: 'asset',
					accountGroupCombined: 'Group1:Group2:Group3',
					status: 'active',
					startDate: '2020-02-02',
					endDate: '2021-14-01'
				},
				id
			);
		}).toThrowError('End date is not a valid date');
	});

	it('Start Date With Incorrect Length Should Produce An Error', () => {
		const id = '123';

		expect(() => {
			accountCreateInsertionData(
				{
					title: 'Test Account',
					type: 'asset',
					accountGroupCombined: 'Group1:Group2:Group3',
					status: 'active',
					startDate: '2020-02-02-02',
					endDate: '2021-01-01'
				},
				id
			);
		}).toThrowError('Start date must be 10 characters');
	});

	it('End Date With Incorrect Length Should Produce An Error', () => {
		const id = '123';

		expect(() => {
			accountCreateInsertionData(
				{
					title: 'Test Account',
					type: 'asset',
					accountGroupCombined: 'Group1:Group2:Group3',
					status: 'active',
					startDate: '2020-02-02',
					endDate: '2021-01-01-01'
				},
				id
			);
		}).toThrowError('End date must be 10 characters');
	});
});
