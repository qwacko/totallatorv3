/**
 * Regex constants to prevent formatting issues with complex patterns
 *
 * By centralizing regex patterns that contain special characters like [],
 * we prevent prettier/eslint import organization from accidentally breaking them.
 */

// Regex escaping pattern for user input sanitization
export const REGEX_ESCAPE_PATTERN = /[.*+?^${}()|[\]\\]/g;

// Common regex patterns used across components
export const REGEX_PATTERNS = {
	// Pattern for escaping regex special characters
	escapeSpecialChars: REGEX_ESCAPE_PATTERN,

	// Pattern for cleaning text for regex use
	cleanForRegex: /[-/\\^$*+?.()|[\]{}]/g,

	// Date validation patterns
	isoDate: /^\d{4}-\d{2}-\d{2}$/,

	// Common validation patterns
	email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
	numeric: /^\d+$/
} as const;

/**
 * Escape special regex characters in a string
 */
export function escapeRegex(str: string): string {
	return str.replace(REGEX_PATTERNS.escapeSpecialChars, '\\$&');
}

/**
 * Create a case-insensitive search regex from a search term
 */
export function createSearchRegex(searchTerm: string): RegExp {
	const escaped = escapeRegex(searchTerm);
	return new RegExp(`(${escaped})`, 'gi');
}
