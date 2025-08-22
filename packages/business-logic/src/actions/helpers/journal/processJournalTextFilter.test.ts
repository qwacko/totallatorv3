import { describe, expect, it } from 'vitest';

import type { JournalFilterSchemaWithoutPaginationType } from '@totallator/shared';

import { processJournalTextFilter } from './processJournalTextFilter';

describe('processJournalTextFilter', () => {
	describe('Description Filtering', () => {
		it('passes through an existing filter without text filter unchanged', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				id: 'hello',
				idArray: ['number1', 'number2'],
				complete: true,
				linked: false,
				transfer: true,
				dataChecked: false,
				reconciled: true,
				excludeId: 'goodbye',
				excludeIdArray: ['number3', 'number4'],
				excludeYearMonth: ['2022-01', '2022-02'],
				excludeTransactionIdArray: ['number5', 'number6'],
				excludeDescription: 'description',
				maxAmount: 100,
				minAmount: 50,
				yearMonth: ['2022-03', '2022-04'],
				transactionIdArray: ['number7', 'number8'],
				description: 'description',
				dateAfter: '2022-05-01',
				dateBefore: '2022-06-02',
				dateSpan: 'lastQuarter',
				account: {
					title: 'title',
					type: ['asset']
				},
				tag: {
					title: 'title'
				},
				excludeBill: {
					title: 'title'
				}
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter))
			);

			expect(processedFilter).toEqual(inputFilter);
		});

		it('textFilter of a single text input adds to the description array', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				id: 'hello',
				idArray: ['number1', 'number2'],
				description: 'description',
				textFilter: 'textFilter'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter))
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				descriptionArray: ['textFilter'],
				textFilter: undefined
			});
		});

		it('textFilter of a multiple text input adds multiple to the description array', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				id: 'hello',
				idArray: ['number1', 'number2'],
				description: 'description',
				textFilter: 'textFilter textFilter2'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter))
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				descriptionArray: ['textFilter', 'textFilter2'],
				textFilter: undefined
			});
		});

		it('textFilter with description:xxx works the same as without description', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				id: 'hello',
				idArray: ['number1', 'number2'],
				description: 'description',
				textFilter: 'description:textFilter description:textFilter2'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter))
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				descriptionArray: ['textFilter', 'textFilter2'],
				textFilter: undefined
			});
		});

		it('textFilter with descriptions surrounded in quotes work correctly.', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				id: 'hello',
				idArray: ['number1', 'number2'],
				description: 'description',
				textFilter: 'description:"text Filter" "text Filter 2"'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				descriptionArray: ['text Filter', 'text Filter 2'],
				textFilter: undefined
			});
		});

		it('textFilter with !description: works correctly.', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				id: 'hello',
				idArray: ['number1', 'number2'],
				description: 'description',
				textFilter: '!description:"text Filter" !description:filter'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter))
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				excludeDescriptionArray: ['text Filter', 'filter'],
				textFilter: undefined
			});
		});

		it('textFilter with : in the text, but not a matching start tag works correctly (i.e. treated as a string)', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				id: 'hello',
				idArray: ['number1', 'number2'],
				description: 'description',
				textFilter: 'party:text description:filter:2'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter))
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				descriptionArray: ['party:text', 'filter:2'],
				textFilter: undefined
			});
		});

		it('textFilter with quote mark in the middle of the text is ignored', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				id: 'hello',
				idArray: ['number1', 'number2'],
				description: 'description',
				textFilter: 'party"text description:"filter"this"'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				descriptionArray: ['party"text', 'filter"this'],
				textFilter: undefined
			});
		});

		it('Unlabelled text starting with ! is treated as excluded', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				id: 'hello',
				idArray: ['number1', 'number2'],
				description: 'description',
				textFilter: 'testText "test Text2" !testText3 !"text Text 4"'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				descriptionArray: ['testText', 'test Text2'],
				excludeDescriptionArray: ['testText3', 'text Text 4'],
				textFilter: undefined
			});
		});

		it('capitalised "Description" works correctly.', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				id: 'hello',
				idArray: ['number1', 'number2'],
				description: 'description',
				textFilter:
					'DESCRIPTION:"text Filter" DESCRIPTION:"filter with space" !DESCriPTION:filter2 !DESCRIPTION:"filter 3"'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				descriptionArray: ['text Filter', 'filter with space'],
				excludeDescriptionArray: ['filter2', 'filter 3'],
				textFilter: undefined
			});
		});

		it('blank after description: is ignored', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				id: 'hello',
				idArray: ['number1', 'number2'],
				description: 'description',
				textFilter: 'description:'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				textFilter: undefined
			});
		});
	});

	describe('Amount Filtering', () => {
		it('max: filter add filter to amount', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'max:10.34'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				maxAmount: 10.34,
				textFilter: undefined
			});
		});

		it('min: filter add filter to amount', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'min:10.34'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				minAmount: 10.34,
				textFilter: undefined
			});
		});

		it('max: and min: filter are compared with any existing max and min filters (larger than current)', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				maxAmount: 90,
				minAmount: 15,
				textFilter: 'min:5 max:100'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				minAmount: 5,
				maxAmount: 100,
				textFilter: undefined
			});
		});

		it('max: and min: filter are compared with any existing max and min filterswithin than current)', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				maxAmount: 100,
				minAmount: 5,
				textFilter: 'min:15 max:90'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				minAmount: 5,
				maxAmount: 100,
				textFilter: undefined
			});
		});

		it('max: and min: filter with non-numbers replaces with zero.', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'min:a.45 max:b'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				minAmount: 0,
				maxAmount: 0,
				textFilter: undefined
			});
		});

		it('multiple max: and min: filters uses the max and min of the combination', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'min:20 min:5 min:10 max:100 max:90 max:95'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				minAmount: 5,
				maxAmount: 100,
				textFilter: undefined
			});
		});

		it('blank max: and min: filters are ignored', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'min: max:'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				textFilter: undefined
			});
		});
	});
	describe('Boolean Filtering (transfer: checked: reconciled: complete: cash:  networth: ', () => {
		it('basic filters work correct (true state)', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'transfer: checked: reconciled: complete: cash: networth:'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				transfer: true,
				dataChecked: true,
				reconciled: true,
				complete: true,
				account: {
					textFilter: ` cash:"" networth:""`
				},
				textFilter: undefined
			});
		});

		it('basic filters work correct (false state)', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: '!transfer: !checked: !reconciled: !complete: !cash: !networth:'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				transfer: false,
				dataChecked: false,
				reconciled: false,
				complete: false,
				account: {
					textFilter: ` !cash:"" !networth:""`
				},
				textFilter: undefined
			});
		});

		it('text after the : in boolean filters is ignored', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter:
					'transfer:true checked:false reconciled:sdfsdlkjvs complete:"sdfd" cash:gggg !networth:5t3ssdf'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				transfer: true,
				dataChecked: true,
				reconciled: true,
				complete: true,
				account: {
					textFilter: ` cash:"gggg" !networth:"5t3ssdf"`
				},
				textFilter: undefined
			});
		});

		it('for multiple instances of a boolean flag, the last one is used (except for nested which are passed through', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter:
					'transfer: !transfer:  !checked: checked: reconciled: !reconciled: !complete: complete: cash: !cash: !networth: networth:'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				transfer: false,
				dataChecked: true,
				reconciled: false,
				complete: true,
				account: { textFilter: ` cash:"" !cash:"" !networth:"" networth:""` },
				textFilter: undefined
			});
		});

		it('text filter overrides the default ones (only for base level items)', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				transfer: false,
				dataChecked: false,
				complete: true,
				reconciled: true,
				account: {
					isCash: true,
					isNetWorth: false
				},
				textFilter: 'transfer: checked: !complete: !reconciled: !cash: networth:'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				transfer: true,
				dataChecked: true,
				reconciled: false,
				complete: false,
				account: {
					isCash: true,
					isNetWorth: false,
					textFilter: ` !cash:"" networth:""`
				},
				textFilter: undefined
			});
		});
	});
	describe('Time Filtering (before: and after:)', () => {
		it('before: and after: update filter correctly (YYYY-MM-DD)', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'before:2020-12-01 after:2020-01-01'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				dateBefore: '2020-12-01',
				dateAfter: '2020-01-01',
				textFilter: undefined
			});
		});

		it('before: and after: update filter correctly (YYYY-M-D)', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'before:2020-12-1 after:2020-1-1'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				dateBefore: '2020-12-01',
				dateAfter: '2020-01-01',
				textFilter: undefined
			});
		});

		it('before: and after: update filter correctly (YY-M-D)', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'before:20-12-1 after:20-1-1'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				dateBefore: '2020-12-01',
				dateAfter: '2020-01-01',
				textFilter: undefined
			});
		});

		it('before: and after: dont update filter if incorrectly formatted or not actual dates', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'before:tuesday after:2020-02-30'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				textFilter: undefined
			});
		});
	});

	describe('month: filtering', () => {
		it('month: filtering adds year-month to array', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'month:2020-01'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				yearMonth: ['2020-01'],
				textFilter: undefined
			});
		});

		it('multiple values adds to array', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter:
					'month:2020-01 month:2020-02 month:2020-03 month:2020-04 month:2020-05 month:2020-06'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				yearMonth: ['2020-01', '2020-02', '2020-03', '2020-04', '2020-05', '2020-06'],
				textFilter: undefined
			});
		});

		it('adds to existing array', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				yearMonth: ['2020-07', '2020-08'],
				textFilter:
					'month:2020-01 month:2020-02 month:2020-03 month:2020-04 month:2020-05 month:2020-06'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				yearMonth: [
					'2020-07',
					'2020-08',
					'2020-01',
					'2020-02',
					'2020-03',
					'2020-04',
					'2020-05',
					'2020-06'
				],
				textFilter: undefined
			});
		});

		it('different formats work', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'month:20-01 month:20-2 month:2020-3 month:2020-04 month:2020-05 month:2020-06'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				yearMonth: ['2020-01', '2020-02', '2020-03', '2020-04', '2020-05', '2020-06'],
				textFilter: undefined
			});
		});

		it('incorrect formats and not real dates dont work', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'month:july month:2020-13 month:2020-00'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				textFilter: undefined
			});
		});

		it('text after the year-month is ignored', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'month:2020-01-01 month:2020-2hello'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				yearMonth: ['2020-01', '2020-02'],
				textFilter: undefined
			});
		});

		it('exclude filter works', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: '!month:2020-01-01 !month:2020-2hello'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				excludeYearMonth: ['2020-01', '2020-02'],
				textFilter: undefined
			});
		});
	});

	describe('Linked Items', () => {
		it('tag: adds a filter.', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'tag:tagFilter'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				tag: { textFilter: ' "tagFilter"' },
				textFilter: undefined
			});
		});

		it('bill: adds a filter.', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'bill:billFilter'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				bill: { textFilter: ' "billFilter"' },
				textFilter: undefined
			});
		});

		it('budget: adds a filter.', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'budget:budgetFilter'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				budget: { textFilter: ' "budgetFilter"' },
				textFilter: undefined
			});
		});

		it('category: adds a filter.', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'category:categoryFilter'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				category: { textFilter: ' "categoryFilter"' },
				textFilter: undefined
			});
		});

		it('label: adds a filter.', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'label:labelFilter'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				label: { textFilter: ' "labelFilter"' },
				textFilter: undefined
			});
		});

		it('account: adds a filter.', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'account:accountFilter'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				account: { textFilter: ` "accountFilter"` },
				textFilter: undefined
			});
		});

		it('payee: adds a filter.', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'payee:payeeFilter'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				payee: { titleArray: ['payeeFilter'] },
				textFilter: undefined
			});
		});

		it('!tag: !bill: !budget: !category: !account: !label: !payee: function correctly', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter:
					'!tag:tagFilter !bill:billFilter !budget:budgetFilter !category:categoryFilter !account:accountFilter !label:labelFilter !payee:payeeFilter'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				excludeTag: { textFilter: ' "tagFilter"' },
				excludeBill: { textFilter: ' "billFilter"' },
				excludeBudget: { textFilter: ' "budgetFilter"' },
				excludeCategory: { textFilter: ' "categoryFilter"' },
				excludeAccount: { textFilter: ` "accountFilter"` },
				excludeLabel: { textFilter: ' "labelFilter"' },
				excludePayee: { titleArray: ['payeeFilter'] },
				textFilter: undefined
			});
		});

		it('tag: bill: budget: category: account: label: payee: Work With quoted strings', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter:
					'tag:"tag Filter" bill:"bill Filter" budget:"budget Filter" category:"category Filter" account:"account Filter" label:"label Filter" payee:"payee Filter"'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				tag: { textFilter: ' "tag Filter"' },
				bill: { textFilter: ' "bill Filter"' },
				budget: { textFilter: ' "budget Filter"' },
				category: { textFilter: ' "category Filter"' },
				account: { textFilter: ` "account Filter"` },
				label: { textFilter: ' "label Filter"' },
				payee: { titleArray: ['payee Filter'] },
				textFilter: undefined
			});
		});

		it('tag: bill: budget: category: account: payee: are ored together if multiple are used', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter:
					'tag:"tag Filter" tag:"tag Filter 2" bill:"bill Filter" bill:"bill Filter 2" budget:"budget Filter" budget:"budget Filter 2" category:"category Filter" category:"category Filter 2" account:"account Filter" account:"account Filter 2" label:"label Filter" label:"label Filter 2" payee:"payee Filter" payee:"payee Filter 2"'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				tag: { textFilter: ` "tag Filter" "tag Filter 2"` },
				bill: { textFilter: ` "bill Filter" "bill Filter 2"` },
				budget: { textFilter: ` "budget Filter" "budget Filter 2"` },
				category: { textFilter: ` "category Filter" "category Filter 2"` },
				account: { textFilter: ` "account Filter" "account Filter 2"` },
				label: { textFilter: ` "label Filter" "label Filter 2"` },
				payee: { titleArray: ['payee Filter', 'payee Filter 2'] },
				textFilter: undefined
			});
		});

		it('!tag: !bill: !budget: !category: !account: !label: !payee: are ored together if multiple are used', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter:
					'!tag:"tag Filter" !tag:"tag Filter 2" !bill:"bill Filter" !bill:"bill Filter 2" !budget:"budget Filter" !budget:"budget Filter 2" !category:"category Filter" !category:"category Filter 2" !account:"account Filter" !account:"account Filter 2" !label:"label Filter" !label:"label Filter 2" !payee:"payee Filter" !payee:"payee Filter 2"'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				excludeTag: { textFilter: ` "tag Filter" "tag Filter 2"` },
				excludeBill: { textFilter: ` "bill Filter" "bill Filter 2"` },
				excludeBudget: { textFilter: ` "budget Filter" "budget Filter 2"` },
				excludeCategory: {
					textFilter: ` "category Filter" "category Filter 2"`
				},
				excludeAccount: { textFilter: ` "account Filter" "account Filter 2"` },
				excludeLabel: { textFilter: ` "label Filter" "label Filter 2"` },
				excludePayee: { titleArray: ['payee Filter', 'payee Filter 2'] },
				textFilter: undefined
			});
		});

		it('type: add an account type filter', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'type:asset'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				account: { textFilter: ` type:"asset"` },
				textFilter: undefined
			});
		});

		it('type: with a comma separate list of type adds these to the account type filter', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'type:asset,liability'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				account: { textFilter: ` type:"asset,liability"` },
				textFilter: undefined
			});
		});

		it('type: with a pipe "|" separate list of type adds these to the account type filter', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'type:asset|liability'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				account: { textFilter: ` type:"asset|liability"` },
				textFilter: undefined
			});
		});

		it('!type: with a comma separate list of type adds these to the account type filter', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: '!type:asset,liability'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				account: { textFilter: ` !type:"asset,liability"` },
				textFilter: undefined
			});
		});

		it('!type: with a pipe "|" separate list of type adds these to the account type filter', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: '!type:asset|liability'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				account: { textFilter: ` !type:"asset|liability"` },
				textFilter: undefined
			});
		});

		it('group: adds an account group filter', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'accountgroup:mortgage'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				account: {
					textFilter: ' group:"mortgage"'
				},
				textFilter: undefined
			});
		});

		it('!group: adds an account group filter', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: '!accountgroup:mortgage'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				excludeAccount: {
					textFilter: ' group:"mortgage"'
				},
				textFilter: undefined
			});
		});

		it('using accountgroup: cash: and type: works together correctly', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'accountgroup:mortgage cash: type:asset|liability accountgroup:cash'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter?.account?.textFilter).toContain(`group:"mortgage"`);
			expect(processedFilter?.account?.textFilter).toContain(`cash:""`);
			expect(processedFilter?.account?.textFilter).toContain(`group:"cash"`);
			expect(processedFilter?.account?.textFilter).toContain(`type:"asset|liability"`);
		});

		it('account boolean filters passthrough works', () => {
			const inputFilter: JournalFilterSchemaWithoutPaginationType = {
				textFilter: 'accountcash: account!nw:'
			};

			// JSON Parse and Stringify to deep clone the object
			const processedFilter = processJournalTextFilter.process(
				JSON.parse(JSON.stringify(inputFilter)),
				false
			);

			expect(processedFilter).toEqual({
				...inputFilter,
				account: {
					textFilter: ' cash:"" !nw:""'
				},
				textFilter: undefined
			});
		});
	});
});
