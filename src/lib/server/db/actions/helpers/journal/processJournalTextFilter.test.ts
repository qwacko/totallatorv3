import { describe, it, expect } from 'vitest';
import type { JournalFilterSchemaWithoutPaginationType } from '$lib/schema/journalSchema';
import { processJournalTextFilter } from './processJournalTextFilter';

describe('processJournalTextFilter', () => {
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
		const processedFilter = processJournalTextFilter(JSON.parse(JSON.stringify(inputFilter)));

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
		const processedFilter = processJournalTextFilter(JSON.parse(JSON.stringify(inputFilter)));

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
		const processedFilter = processJournalTextFilter(JSON.parse(JSON.stringify(inputFilter)));

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
		const processedFilter = processJournalTextFilter(JSON.parse(JSON.stringify(inputFilter)));

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
		const processedFilter = processJournalTextFilter(JSON.parse(JSON.stringify(inputFilter)));

		expect(processedFilter).toEqual({
			...inputFilter,
			descriptionArray: ['text Filter', 'text Filter 2'],
			textFilter: undefined
		});
	});
});
