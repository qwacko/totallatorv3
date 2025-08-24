import { describe, expect, it } from 'vitest';

import { expandDate } from './expandDate';

describe('expandDate', () => {
	it('should expand the date correctly', () => {
		const date = '2022-01-01';
		const expandedDate = expandDate(date);

		expect(expandedDate.yearMonthDay).toBe('2022-01-01');
		expect(expandedDate.yearWeek).toBe('2021-W52');
		expect(expandedDate.yearMonth).toBe('2022-01');
		expect(expandedDate.yearQuarter).toBe('2022-Q01');
		expect(expandedDate.year).toBe('2022');
		expect(expandedDate.date).toEqual(new Date(date));
		expect(expandedDate.dateText).toBe('2022-01-01');
	});

	it('should work correctly with a date in the middle of the year', () => {
		const date = '2022-06-30';
		const expandedDate = expandDate(date);

		expect(expandedDate.yearMonthDay).toBe('2022-06-30');
		expect(expandedDate.yearWeek).toBe('2022-W26');
		expect(expandedDate.yearMonth).toBe('2022-06');
		expect(expandedDate.yearQuarter).toBe('2022-Q02');
		expect(expandedDate.year).toBe('2022');
		expect(expandedDate.date).toEqual(new Date(date));
		expect(expandedDate.dateText).toBe('2022-06-30');
	});

	it('Should Work Correctly for a leap year date', () => {
		const date = '2020-02-29';
		const expandedDate = expandDate(date);

		expect(expandedDate.yearMonthDay).toBe('2020-02-29');
		expect(expandedDate.yearWeek).toBe('2020-W09');
		expect(expandedDate.yearMonth).toBe('2020-02');
		expect(expandedDate.yearQuarter).toBe('2020-Q01');
		expect(expandedDate.year).toBe('2020');
		expect(expandedDate.date).toEqual(new Date(date));
		expect(expandedDate.dateText).toBe('2020-02-29');
	});

	it('Date In First Day Of New Year Should Have Correct Year Week (from previous year)', () => {
		const date = '2023-01-01';
		const expandedDate = expandDate(date);

		expect(expandedDate.yearMonthDay).toBe('2023-01-01');
		expect(expandedDate.yearWeek).toBe('2022-W52');
		expect(expandedDate.yearMonth).toBe('2023-01');
		expect(expandedDate.yearQuarter).toBe('2023-Q01');
		expect(expandedDate.year).toBe('2023');
		expect(expandedDate.date).toEqual(new Date(date));
		expect(expandedDate.dateText).toBe('2023-01-01');
	});

	// Add more test cases here to cover different scenarios
});
