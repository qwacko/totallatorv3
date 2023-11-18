import { describe, it, expect } from 'vitest';
import { processConfigString } from './importTransformation'; // Adjust the import path

describe('processConfigString', () => {
	it('should correctly replace substring operations', () => {
		const inputObject = { description: 'This is a description' };
		const configString = '{description:substring:2:8}';
		const result = processConfigString(configString, inputObject);
		expect(result).toBe('is is a ');
	});

	it('should correctly replace regex operations', () => {
		const inputObject = { text: 'Hello World' };
		const configString = '{text:regex:o:0}';
		const result = processConfigString(configString, inputObject);
		expect(result).toBe('Hell0 W0rld');
	});

	it('should correctly replace multiply operations', () => {
		const inputObject = { number: '10' };
		const configString = '{number:multiply:2}';
		const result = processConfigString(configString, inputObject);
		expect(result).toBe('20');
	});

	it('should throw an error for missing keys', () => {
		const inputObject = { description: 'This is a description' };
		const configString = '{nonExistentKey:substring:2:5}';
		expect(() => processConfigString(configString, inputObject)).toThrow(
			/Key 'nonExistentKey' not found/
		);
	});

	it('should throw an error for unsupported operations', () => {
		const inputObject = { description: 'This is a description' };
		const configString = '{description:unsupportedOperation:2:5}';
		expect(() => processConfigString(configString, inputObject)).toThrow(
			/Unsupported operation 'unsupportedOperation'/
		);
	});

	it('should handle complex configurations', () => {
		const inputObject = {
			firstName: 'John',
			lastName: 'Doe',
			age: '30'
		};
		const configString = '{firstName:direct} {lastName:direct} is {age:multiply:2} years old';
		const result = processConfigString(configString, inputObject);
		expect(result).toBe('John Doe is 60 years old');
	});
});
