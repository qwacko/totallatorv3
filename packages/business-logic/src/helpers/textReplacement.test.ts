import { describe, expect, it } from 'vitest';

import {
	findWordBoundariesAtCursor,
	getCurrentWordAtCursor,
	replaceWordAtCursor
} from './textReplacement';

describe('textReplacement utilities', () => {
	describe('findWordBoundariesAtCursor', () => {
		it('should find word boundaries in simple single word', () => {
			const result = findWordBoundariesAtCursor('hello', 3);
			expect(result).toEqual({ start: 0, end: 5, word: 'hello' });
		});

		it('should find word boundaries at start of word', () => {
			const result = findWordBoundariesAtCursor('hello world', 0);
			expect(result).toEqual({ start: 0, end: 5, word: 'hello' });
		});

		it('should find word boundaries at end of word', () => {
			const result = findWordBoundariesAtCursor('hello world', 5);
			expect(result).toEqual({ start: 0, end: 5, word: 'hello' });
		});

		it('should find word boundaries in the middle of second word', () => {
			const result = findWordBoundariesAtCursor('hello world', 8);
			expect(result).toEqual({ start: 6, end: 11, word: 'world' });
		});

		it('should handle cursor at space (start of word)', () => {
			const result = findWordBoundariesAtCursor('hello world', 6);
			expect(result).toEqual({ start: 6, end: 11, word: 'world' });
		});

		it('should handle empty word after space', () => {
			const result = findWordBoundariesAtCursor('hello ', 6);
			expect(result).toEqual({ start: 6, end: 6, word: '' });
		});

		it('should handle complex multi-word scenario', () => {
			const result = findWordBoundariesAtCursor('title:JTM sing', 14);
			expect(result).toEqual({ start: 10, end: 14, word: 'sing' });
		});

		it('should handle partial word typing', () => {
			const result = findWordBoundariesAtCursor('title:JTM s', 11);
			expect(result).toEqual({ start: 10, end: 11, word: 's' });
		});
	});

	describe('replaceWordAtCursor', () => {
		it('should replace simple single word', () => {
			const result = replaceWordAtCursor('hello', 3, 'goodbye');
			expect(result).toEqual({
				newText: 'goodbye',
				newCursorPosition: 7
			});
		});

		it('should replace first word in multi-word text', () => {
			const result = replaceWordAtCursor('hello world', 3, 'hi');
			expect(result).toEqual({
				newText: 'hi world',
				newCursorPosition: 2
			});
		});

		it('should replace second word in multi-word text', () => {
			const result = replaceWordAtCursor('hello world', 8, 'universe');
			expect(result).toEqual({
				newText: 'hello universe',
				newCursorPosition: 14
			});
		});

		it('should handle the problematic scenario: title:JTM sing -> single:', () => {
			const result = replaceWordAtCursor('title:JTM sing', 14, 'single:');
			expect(result).toEqual({
				newText: 'title:JTM single:',
				newCursorPosition: 17
			});
		});

		it('should handle cursor in middle of word: title:Name sing -> single:', () => {
			// When cursor is in middle of "sing" (e.g., at position 13 = 's|ing')
			const result = replaceWordAtCursor('title:Name sing', 13, 'single:');
			expect(result).toEqual({
				newText: 'title:Name single:',
				newCursorPosition: 18
			});
		});

		it('should handle cursor at start of word: title:Name sing -> single:', () => {
			// When cursor is at start of "sing" (position 11 = '|sing')
			const result = replaceWordAtCursor('title:Name sing', 11, 'single:');
			expect(result).toEqual({
				newText: 'title:Name single:',
				newCursorPosition: 18
			});
		});

		it('should handle partial word replacement', () => {
			const result = replaceWordAtCursor('title:JTM s', 11, 'single:');
			expect(result).toEqual({
				newText: 'title:JTM single:',
				newCursorPosition: 17
			});
		});

		it('should handle replacement at end of text', () => {
			const result = replaceWordAtCursor('prefix tit', 10, 'title:');
			expect(result).toEqual({
				newText: 'prefix title:',
				newCursorPosition: 13
			});
		});

		it('should handle replacement in middle with text after', () => {
			const result = replaceWordAtCursor('start mid end', 7, 'middle');
			expect(result).toEqual({
				newText: 'start middle end',
				newCursorPosition: 12
			});
		});

		it('should handle empty word replacement', () => {
			const result = replaceWordAtCursor('hello ', 6, 'world');
			expect(result).toEqual({
				newText: 'hello world',
				newCursorPosition: 11
			});
		});
	});

	describe('getCurrentWordAtCursor', () => {
		it('should get current word being typed', () => {
			expect(getCurrentWordAtCursor('title:JTM sing', 14)).toBe('sing');
			expect(getCurrentWordAtCursor('title:JTM s', 11)).toBe('s');
			expect(getCurrentWordAtCursor('hello world', 8)).toBe('world');
			expect(getCurrentWordAtCursor('test', 2)).toBe('test');
		});

		it('should handle empty word', () => {
			expect(getCurrentWordAtCursor('hello ', 6)).toBe('');
		});
	});

	describe('exact user scenario', () => {
		it('should handle exact user scenario: title:Name sing -> single:', () => {
			// Test different cursor positions in "sing"
			const text = 'title:Name sing';

			// Cursor at 's' (position 11)
			let result = replaceWordAtCursor(text, 11, 'single:');
			expect(result.newText).toBe('title:Name single:');

			// Cursor at 'i' (position 12)
			result = replaceWordAtCursor(text, 12, 'single:');
			expect(result.newText).toBe('title:Name single:');

			// Cursor at 'n' (position 13)
			result = replaceWordAtCursor(text, 13, 'single:');
			expect(result.newText).toBe('title:Name single:');

			// Cursor at 'g' (position 14)
			result = replaceWordAtCursor(text, 14, 'single:');
			expect(result.newText).toBe('title:Name single:');

			// Cursor at end (position 15)
			result = replaceWordAtCursor(text, 15, 'single:');
			expect(result.newText).toBe('title:Name single:');
		});

		it('should verify what the user is experiencing', () => {
			// This should NOT happen according to user report
			const result = replaceWordAtCursor('title:Name sing', 13, 'single:');
			// User says result is "single: sing" but it should be "title:Name single:"
			expect(result.newText).not.toBe('single: sing');
			expect(result.newText).toBe('title:Name single:');
		});
	});

	describe('edge cases', () => {
		it('should handle empty string', () => {
			const result = replaceWordAtCursor('', 0, 'hello');
			expect(result).toEqual({
				newText: 'hello',
				newCursorPosition: 5
			});
		});

		it('should handle single character', () => {
			const result = replaceWordAtCursor('a', 1, 'hello');
			expect(result).toEqual({
				newText: 'hello',
				newCursorPosition: 5
			});
		});

		it('should throw error for invalid cursor position', () => {
			expect(() => findWordBoundariesAtCursor('hello', -1)).toThrow();
			expect(() => findWordBoundariesAtCursor('hello', 6)).toThrow();
		});
	});
});
