import { describe, expect, it } from 'vitest';

import { arrayToText } from './arrayToText';

describe('arrayToText', () => {
	it('When called without a itemToText function it should return just the titles.', async () => {
		const data = ['apple', 'banana', 'cherry'];
		const result = await arrayToText({ data });
		expect(result).toBe('Is one of apple, banana, cherry');
	});

	it('When called with a itemToText function it should return the converted titles.', async () => {
		const data = ['apple', 'banana', 'cherry'];
		const itemToText = async (inValue: string[]) => inValue.map((value) => value.toUpperCase());
		const result = await arrayToText({ data, inputToText: itemToText });
		expect(result).toBe('Is one of APPLE, BANANA, CHERRY');
	});

	it('When called with a singularName it should return the singularName in the text.', async () => {
		const data = ['apple', 'banana', 'cherry'];
		const result = await arrayToText({ data, singularName: 'fruit' });
		expect(result).toBe('fruit is one of apple, banana, cherry');
	});

	it('When called with no data it should return an empty string.', async () => {
		const data: string[] = [];
		const result = await arrayToText({ data });
		expect(result).toBe('');
	});

	it('When called with one item it should return the item.', async () => {
		const data = ['apple'];
		const result = await arrayToText({ data });
		expect(result).toBe('Is apple');
	});

	it('When called with two items it should return the items.', async () => {
		const data = ['apple', 'banana'];
		const result = await arrayToText({ data });
		expect(result).toBe('Is one of apple, banana');
	});

	it('When called with three items it should return the items.', async () => {
		const data = ['apple', 'banana', 'cherry'];
		const result = await arrayToText({ data });
		expect(result).toBe('Is one of apple, banana, cherry');
	});

	it('When called with four items it should return the items.', async () => {
		const data = ['apple', 'banana', 'cherry', 'date'];
		const result = await arrayToText({ data });
		expect(result).toBe('Is one of apple, banana, cherry, date');
	});

	it('When called with five items it should return the count.', async () => {
		const data = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
		const result = await arrayToText({ data });
		expect(result).toBe('Is one of 5 values');
	});
});
