import { describe, it, expect } from 'vitest';
import { processConfigString } from './importTransformation'; // Adjust the import path

describe('processConfigString', () => {
	it('should correctly replace substring operations', () => {
		const inputObject = { description: 'This is a description' };
		const configString = '{{substring description 2 7}}';
		const result = processConfigString(configString, inputObject);
		expect(result).toBe('is is a');
	});

	it('should trim the result', () => {
		const inputObject = { description: 'This is a description' };
		const configString = '{{substring description 2 8}}';
		const result = processConfigString(configString, inputObject);
		expect(result).toBe('is is a');
	});

	it('should correctly replace regex operations', () => {
		const inputObject = { text: 'Hello World' };
		const configString = '{{regexReplace text "o" "0"}}';
		const result = processConfigString(configString, inputObject);
		expect(result).toBe('Hell0 W0rld');
	});

	it('should correctly replace multiply operations', () => {
		const inputObject = { number: '10' };
		const configString = '{{multiply number 2}}';
		const result = processConfigString(configString, inputObject);
		expect(result).toBe('20');
	});

	it('should throw an error for missing keys', () => {
		const inputObject = { description: 'This is a description' };
		const configString = '{{substring nonExistentKey 2 5}}';
		expect(() => processConfigString(configString, inputObject)).toThrow('Cannot read properties');
	});

	it('should handle complex configurations', () => {
		const inputObject = {
			firstName: 'John',
			lastName: 'Doe',
			age: '30'
		};
		const configString = '{{firstName}} {{lastName}} is {{multiply age 2}} years old';
		const result = processConfigString(configString, inputObject);
		expect(result).toBe('John Doe is 60 years old');
	});

	it('should handle config arrays', () => {
		const inputObject = {
			firstName: 'John',
			lastName: 'Doe',
			age: '30'
		};
		const configString = ['{{firstName}}', 'Test', '-{{lastName}}'];
		const result = processConfigString(configString, inputObject);
		expect(result).toBeInstanceOf(Array);
		expect(result).toEqual(['John', 'Test', '-Doe']);
	});

	it('should handle config arrays undefined / empty return values', () => {
		const inputObject = {
			firstName: 'John',
			lastName: 'Doe',
			age: '30'
		};
		const configString = [
			'{{firstName}}',
			"{{#if (eq firstName 'Alice')}}Alice{{/if}}",
			'-{{lastName}}'
		];
		const result = processConfigString(configString, inputObject);
		expect(result).toBeInstanceOf(Array);
		expect(result).toEqual(['John', '-Doe']);
	});

	it('should correctly handle conditional operations', () => {
		const inputObject = {
			status: 'active',
			firstName: 'Jane',
			lastName: 'Doe'
		};
		const configString = "{{#if (eq status 'active')}}{{firstName}}{{else}}{{lastName}}{{/if}}";

		const result = processConfigString(configString, inputObject);
		expect(result).toBe('Jane');

		const configStringInactive =
			"{{#if (eq status 'disabled')}}{{firstName}}{{else}}{{lastName}}{{/if}}";
		const resultInactive = processConfigString(configStringInactive, inputObject);
		expect(resultInactive).toBe('Doe');
	});
});
