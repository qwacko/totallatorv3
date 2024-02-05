import { describe, it, expect } from 'vitest';
import { generateDateItemsBetween } from './generateDateItemsBetween';

describe('generateDateIemsBetween', () => {
	it('should generate year-months between two dates', () => {
		const result = generateDateItemsBetween({
			startDate: '2021-01-01',
			endDate: '2021-03-01',
			timeUnit: 'month'
		});
		expect(result).toEqual(['2021-01', '2021-02', '2021-03']);
	});

	it('should handle same start and end date', () => {
		const result = generateDateItemsBetween({
			startDate: '2021-01-01',
			endDate: '2021-01-01',
			timeUnit: 'month'
		});
		expect(result).toEqual(['2021-01']);
	});

	it('should return empty array for end date before start date', () => {
		const result = generateDateItemsBetween({
			startDate: '2021-03-01',
			endDate: '2021-01-01',
			timeUnit: 'month'
		});
		expect(result).toEqual([]);
	});

	it('should generate days between two dates', () => {
		const result = generateDateItemsBetween({
			startDate: '2021-01-01',
			endDate: '2021-01-03',
			timeUnit: 'day'
		});
		expect(result).toEqual(['2021-01-01', '2021-01-02', '2021-01-03']);
	});

	it('should generate weeks between two dates', () => {
		const result = generateDateItemsBetween({
			startDate: '2021-01-01',
			endDate: '2021-01-15',
			timeUnit: 'week'
		});
		expect(result).toEqual(['2020-W53', '2021-W01', '2021-W02']);
	});

	it('should generate quarters between two dates', () => {
		const result = generateDateItemsBetween({
			startDate: '2021-01-01',
			endDate: '2021-03-01',
			timeUnit: 'quarter'
		});
		expect(result).toEqual(['2021-Q01']);
	});

	it('should generate years between two dates', () => {
		const result = generateDateItemsBetween({
			startDate: '2021-01-01',
			endDate: '2023-01-01',
			timeUnit: 'year'
		});
		expect(result).toEqual(['2021', '2022', '2023']);
	});

	it('For Large Time Span, all weeks are generated', () => {
		const result = generateDateItemsBetween({
			startDate: '2010-01-01',
			endDate: '2022-01-01',
			timeUnit: 'week'
		});
		expect(result.length).toEqual(627);
	});
});
