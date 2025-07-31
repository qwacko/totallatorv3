# Regex Pattern Guidelines

This document outlines best practices for using regex patterns in the codebase to prevent formatting issues.

## The Problem

When using `pnpm format`, Prettier occasionally reorders imports in a way that can break complex regex patterns, especially those containing square brackets `[]`. This happened in SearchInput.svelte where a regex pattern was split across lines during import reordering.

## Solution

### 1. Use Centralized Regex Constants

Instead of defining complex regex patterns inline, use the centralized constants:

```typescript
// ❌ Avoid - can be broken by formatting
const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

// ✅ Preferred - use centralized helper
import { createSearchRegex } from '$lib/helpers/regexConstants';
const regex = createSearchRegex(searchTerm);
```

### 2. Available Regex Constants

The following constants and functions are available in `$lib/helpers/regexConstants`:

- `REGEX_PATTERNS.escapeSpecialChars` - Pattern for escaping regex special characters
- `REGEX_PATTERNS.cleanForRegex` - Pattern for cleaning text 
- `escapeRegex(str)` - Function to escape special characters
- `createSearchRegex(searchTerm)` - Function to create search regex with highlighting

### 3. When to Use This Approach

Use centralized regex constants when:
- The pattern contains square brackets `[]`
- The pattern spans multiple lines
- The pattern contains complex escaping
- The pattern is used in multiple places

### 4. Simple Patterns Are Still OK

Simple patterns that don't contain problematic characters can still be defined inline:

```typescript
// ✅ This is fine - simple pattern, no brackets
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
```

## Best Practices

1. **Test after formatting**: Always run `pnpm format` and verify regex patterns still work
2. **Use constants for complex patterns**: Move complex regex to `regexConstants.ts`
3. **Document complex patterns**: Add comments explaining what the regex does
4. **Prefer string methods when possible**: Sometimes `String.includes()` or `String.startsWith()` is simpler than regex

## Files Updated

The following files have been updated to use the centralized approach:
- `apps/webapp/src/lib/components/SearchInput.svelte`
- `apps/webapp/src/lib/components/HighlightText.svelte`
- `apps/webapp/src/lib/helpers/regexConstants.ts` (new file)