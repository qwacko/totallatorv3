import { describe, it, expect } from 'vitest';
import type { AccountFilterSchemaWithoutPaginationType } from '@totallator/shared';
import { processAccountTextFilter } from './accountTextFilter';

describe('processAccountTextFilter', () => {
	it('passes through an existing filter without text filter unchanged', () => {
		const accountFilter: AccountFilterSchemaWithoutPaginationType = {
			importDetailIdArray: ['1'],
			importIdArray: ['2']
		};

		const processedFilter = processAccountTextFilter.process(
			JSON.parse(JSON.stringify(accountFilter))
		);

		expect(processedFilter).toEqual(accountFilter);
	});

	it('title filtering works correctly', () => {
		const accountFilter: AccountFilterSchemaWithoutPaginationType = {
			textFilter: `mcdonalds "burger king" title:"fast food" description:pizza`,
			importDetailIdArray: ['1'],
			importIdArray: ['2']
		};

		const processedFilter = processAccountTextFilter.process(
			JSON.parse(JSON.stringify(accountFilter))
		);

		expect(processedFilter).toEqual({
			...accountFilter,
			titleArray: ['mcdonalds', 'burger king', 'fast food', 'pizza'],
			textFilter: undefined
		});
	});

	it('!title filtering works correctly', () => {
		const accountFilter: AccountFilterSchemaWithoutPaginationType = {
			textFilter: `!mcdonalds !"burger king" !title:"fast food" !description:pizza`,
			importDetailIdArray: ['1'],
			importIdArray: ['2']
		};

		const processedFilter = processAccountTextFilter.process(
			JSON.parse(JSON.stringify(accountFilter))
		);

		expect(processedFilter).toEqual({
			...accountFilter,
			excludeTitleArray: ['mcdonalds', 'burger king', 'fast food', 'pizza'],
			textFilter: undefined
		});
	});

	it('Group Filtering (All Types) works correctly', () => {
		const accountFilter: AccountFilterSchemaWithoutPaginationType = {
			textFilter: `group1:"group1" group2:"group2" group3:"group3" groupCombined:"groupCombined" titlecombined:"title"`,
			importDetailIdArray: ['1'],
			importIdArray: ['2']
		};

		const processedFilter = processAccountTextFilter.process(
			JSON.parse(JSON.stringify(accountFilter))
		);

		expect(processedFilter).toEqual({
			...accountFilter,
			accountGroupArray: ['group1'],
			accountGroup2Array: ['group2'],
			accountGroup3Array: ['group3'],
			accountGroupCombinedArray: ['groupCombined'],
			accountTitleCombinedArray: ['title'],
			textFilter: undefined
		});
	});

	it('!Group Filtering (All Types) works correctly', () => {
		const accountFilter: AccountFilterSchemaWithoutPaginationType = {
			textFilter: `!group1:"group1" !group2:"group2" !group3:"group3" !groupCombined:"groupCombined" !titlecombined:"title"`,
			importDetailIdArray: ['1'],
			importIdArray: ['2']
		};

		const processedFilter = processAccountTextFilter.process(
			JSON.parse(JSON.stringify(accountFilter))
		);

		expect(processedFilter).toEqual({
			...accountFilter,
			excludeAccountGroupArray: ['group1'],
			excludeAccountGroup2Array: ['group2'],
			excludeAccountGroup3Array: ['group3'],
			excludeAccountGroupCombinedArray: ['groupCombined'],
			excludeAccountTitleCombinedArray: ['title'],
			textFilter: undefined
		});
	});

	it('import filtering works correctly', () => {
		const accountFilter: AccountFilterSchemaWithoutPaginationType = {
			textFilter: `importid:7 import:8 importdetail:9 importdetailid:10 !importid:1 !import:2 !importdetail:3 !importdetailid:4`,
			importDetailIdArray: ['1'],
			importIdArray: ['2']
		};

		const processedFilter = processAccountTextFilter.process(
			JSON.parse(JSON.stringify(accountFilter))
		);

		expect(processedFilter).toEqual({
			importIdArray: ['2', '7', '8'],
			importDetailIdArray: ['1', '9', '10'],
			excludeImportIdArray: ['1', '2'],
			excludeImportDetailIdArray: ['3', '4'],
			textFilter: undefined
		});
	});

	it('status filtering works correctly', () => {
		const accountFilter: AccountFilterSchemaWithoutPaginationType = {
			textFilter: `status:active !status:disabled status:"disabled"`,
			importDetailIdArray: ['1'],
			importIdArray: ['2']
		};

		const processedFilter = processAccountTextFilter.process(
			JSON.parse(JSON.stringify(accountFilter))
		);

		expect(processedFilter).toEqual({
			...accountFilter,
			statusArray: ['active', 'disabled'],
			excludeStatusArray: ['disabled'],
			textFilter: undefined
		});
	});

	it('boolean filtering works correctly', () => {
		const accountFilter: AccountFilterSchemaWithoutPaginationType = {
			textFilter: `disabled: allowUpdate: active: nw: cash:`,
			importDetailIdArray: ['1'],
			importIdArray: ['2']
		};

		const processedFilter = processAccountTextFilter.process(
			JSON.parse(JSON.stringify(accountFilter))
		);

		expect(processedFilter).toEqual({
			...accountFilter,
			disabled: true,
			allowUpdate: true,
			active: true,
			isNetWorth: true,
			isCash: true,

			textFilter: undefined
		});
	});

	it('!boolean filtering works correctly', () => {
		const accountFilter: AccountFilterSchemaWithoutPaginationType = {
			textFilter: `!disabled: !allowUpdate: !active: !nw: !cash:`,
			importDetailIdArray: ['1'],
			importIdArray: ['2'],
			disabled: true,
			allowUpdate: true,
			active: true,
			isNetWorth: true,
			isCash: true
		};

		const processedFilter = processAccountTextFilter.process(
			JSON.parse(JSON.stringify(accountFilter))
		);

		expect(processedFilter).toEqual({
			...accountFilter,
			disabled: false,
			allowUpdate: false,
			active: false,
			isNetWorth: false,
			isCash: false,

			textFilter: undefined
		});
	});

	it(' text based !boolean filtering overwrites default', () => {
		const accountFilter: AccountFilterSchemaWithoutPaginationType = {
			textFilter: `!disabled: !allowUpdate: !active: !nw: !cash:`,

			importDetailIdArray: ['1'],
			importIdArray: ['2']
		};

		const processedFilter = processAccountTextFilter.process(
			JSON.parse(JSON.stringify(accountFilter))
		);

		expect(processedFilter).toEqual({
			...accountFilter,
			disabled: false,
			allowUpdate: false,
			active: false,
			isNetWorth: false,
			isCash: false,

			textFilter: undefined
		});
	});

	it('type filtering works correctly', () => {
		const accountFilter: AccountFilterSchemaWithoutPaginationType = {
			textFilter: `type:asset type:liability !type:"income|expense"`,

			importDetailIdArray: ['1'],
			importIdArray: ['2']
		};

		const processedFilter = processAccountTextFilter.process(
			JSON.parse(JSON.stringify(accountFilter))
		);

		expect(processedFilter).toEqual({
			...accountFilter,
			type: ['asset', 'liability'],
			excludeType: ['income', 'expense'],
			textFilter: undefined
		});
	});
});
