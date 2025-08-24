/**
 * Utility functions for text replacement in autocomplete scenarios
 */

export interface TextReplacementResult {
	newText: string;
	newCursorPosition: number;
}

export interface WordBoundary {
	start: number;
	end: number;
	word: string;
}

/**
 * Find the word boundaries at a given cursor position
 */
export function findWordBoundariesAtCursor(text: string, cursorPosition: number): WordBoundary {
	// Handle edge cases
	if (cursorPosition < 0 || cursorPosition > text.length) {
		throw new Error(`Invalid cursor position: ${cursorPosition} for text length: ${text.length}`);
	}

	// Find start of current word (go backwards until whitespace or start)
	let start = cursorPosition;
	while (start > 0 && !/\s/.test(text[start - 1])) {
		start--;
	}

	// Find end of current word (go forwards until whitespace or end)
	let end = cursorPosition;
	while (end < text.length && !/\s/.test(text[end])) {
		end++;
	}

	const word = text.slice(start, end);

	return { start, end, word };
}

/**
 * Replace the word at cursor position with a new word
 */
export function replaceWordAtCursor(
	text: string,
	cursorPosition: number,
	replacement: string
): TextReplacementResult {
	const boundary = findWordBoundariesAtCursor(text, cursorPosition);

	const beforeWord = text.slice(0, boundary.start);
	const afterWord = text.slice(boundary.end);

	const newText = beforeWord + replacement + afterWord;
	const newCursorPosition = beforeWord.length + replacement.length;

	return {
		newText,
		newCursorPosition
	};
}

/**
 * Get the current word being typed at cursor position (used for autocomplete matching)
 */
export function getCurrentWordAtCursor(text: string, cursorPosition: number): string {
	const boundary = findWordBoundariesAtCursor(text, cursorPosition);
	return boundary.word;
}
