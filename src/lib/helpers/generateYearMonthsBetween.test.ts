import { describe, it, expect } from 'vitest';
import {
	generateYearMonthsBetween,
	generateYearMonthsBeforeToday
} from './generateYearMonthsBetween'; // Adjust the import path

describe('generateYearMonthsBetween', () => {
	it('should generate year-months between two dates', () => {
		const result = generateYearMonthsBetween('2021-01', '2021-03');
		expect(result).toEqual(['2021-01', '2021-02', '2021-03']);
	});

	it('should handle same start and end date', () => {
		const result = generateYearMonthsBetween('2021-01', '2021-01');
		expect(result).toEqual(['2021-01']);
	});

	it('should return empty array for end date before start date', () => {
		const result = generateYearMonthsBetween('2021-03', '2021-01');
		expect(result).toEqual([]);
	});
});

describe('generateYearMonthsBeforeToday', () => {
	it('should generate year-months for a given number of months before today', () => {
		const today = new Date();
		const year = today.getFullYear();
		const month = today.getMonth() + 1; // Months are 0-indexed in JavaScript
		const currentYearMonth = `${year}-${month.toString().padStart(2, '0')}`;

		const result = generateYearMonthsBeforeToday(2);
		expect(result).toContain(currentYearMonth);
		expect(result.length).toBe(2); // Including the current month and the two previous months
	});

	it('should handle 0 months', () => {
		const result = generateYearMonthsBeforeToday(0);
		expect(result).toEqual([]);
	});

	// Add more tests as needed for other scenarios and edge cases
});
