import { describe, expect, it } from 'vitest';

import { decryptText, encryptText } from './encryption';

describe('encryption', () => {
	it('should encrypt and decrypt text correctly', () => {
		const originalText = 'sk-1234567890abcdef';
		const encrypted = encryptText(originalText);
		const decrypted = decryptText(encrypted);

		expect(decrypted).toBe(originalText);
		expect(encrypted).not.toBe(originalText);
		expect(encrypted.length).toBeGreaterThan(originalText.length);
	});

	it('should produce different encrypted values for the same input', () => {
		const text = 'test-api-key';
		const encrypted1 = encryptText(text);
		const encrypted2 = encryptText(text);

		expect(encrypted1).not.toBe(encrypted2);
		expect(decryptText(encrypted1)).toBe(text);
		expect(decryptText(encrypted2)).toBe(text);
	});

	it('should handle empty strings', () => {
		const empty = '';
		const encrypted = encryptText(empty);
		const decrypted = decryptText(encrypted);

		expect(decrypted).toBe(empty);
	});
});
