import type { TextFilterOptionsType } from '@/actions/helpers/misc/processTextFilter';
import type { AutocompleteKey } from '@totallator/shared';
import { statusEnum } from '@totallator/shared';
import { accountTypeEnum } from '@totallator/shared';

interface FilterMetadata {
	keys: string[];
	description?: string;
	type: 'text' | 'number' | 'date' | 'boolean' | 'enum';
	enumValues?: string[];
	examples?: string[];
	invertable?: boolean;
}

/**
 * Extracts autocomplete configuration from server-side text filter arrays
 */
export function extractAutocompleteFromTextFilter<T extends { textFilter?: string }>(
	filterArray: TextFilterOptionsType<T>,
	entityType: 'tag' | 'account' | 'category' | 'label' | 'bill' | 'budget' | 'journal' | 'file'
): AutocompleteKey[] {
	const autocompleteKeys: AutocompleteKey[] = [];

	// Create a map to avoid duplicates and group related keys
	const keyMap = new Map<string, FilterMetadata>();

	filterArray.forEach((filterItem) => {
		const keys = Array.isArray(filterItem.key) ? filterItem.key : [filterItem.key];

		keys.forEach((key) => {
			// Remove prefixes like '!' to group related keys
			const baseKey = key.replace(/^!/, '');
			const isNegated = key.startsWith('!');

			if (!keyMap.has(baseKey)) {
				keyMap.set(baseKey, {
					keys: [baseKey],
					...inferFilterMetadata(baseKey, entityType),
					invertable: false
				});
			}

			const metadata = keyMap.get(baseKey)!;

			// If we see both positive and negative versions, mark as invertable
			if (isNegated || keys.some((k) => k.startsWith('!') && k.slice(1) === baseKey)) {
				metadata.invertable = true;
			}

			// Add the key if not already present
			if (!metadata.keys.includes(key)) {
				metadata.keys.push(key);
			}
		});
	});

	// Convert to AutocompleteKey format
	keyMap.forEach((metadata, baseKey) => {
		// Clean up keys - prefer the shortest/most common variant
		const cleanKeys = metadata.keys.filter((k) => !k.startsWith('!'));
		const primaryKey = cleanKeys.sort((a, b) => a.length - b.length)[0] || baseKey;

		autocompleteKeys.push({
			key: primaryKey,
			desc: metadata.description || generateDescription(baseKey, entityType),
			invertable: metadata.invertable || false,
			type: metadata.type,
			enumValues: metadata.enumValues,
			examples: metadata.examples
		});
	});

	return autocompleteKeys.sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Infer metadata about a filter key based on its name and entity type
 */
function inferFilterMetadata(
	key: string,
	entityType: string
): Omit<FilterMetadata, 'keys' | 'invertable'> {
	const lowerKey = key.toLowerCase();

	// Status-related keys
	if (lowerKey.includes('status')) {
		return {
			type: 'enum',
			enumValues: [...statusEnum],
			description: 'Filter by status',
			examples: ['status:active', 'status:disabled']
		};
	}

	// Account type keys
	if (lowerKey.includes('accounttype') || lowerKey === 'type:') {
		return {
			type: 'enum',
			enumValues: [...accountTypeEnum],
			description: 'Filter by account type',
			examples: ['type:asset', 'type:expense']
		};
	}

	// Boolean flags
	if (
		[
			'disabled:',
			'active:',
			'allowupdate:',
			'cash:',
			'networth:',
			'nw:',
			'file:',
			'files:',
			'note:',
			'notes:',
			'reminder:',
			'reminders:'
		].includes(lowerKey)
	) {
		return {
			type: 'boolean',
			description: generateDescription(key, entityType),
			examples: [`${key}`, `!${key}`]
		};
	}

	// Number fields
	if (
		lowerKey.includes('min') ||
		lowerKey.includes('max') ||
		lowerKey.includes('count') ||
		lowerKey.includes('total')
	) {
		return {
			type: 'number',
			description: generateDescription(key, entityType),
			examples: [`${key}100`, `${key}50.25`]
		};
	}

	// Date fields
	if (
		lowerKey.includes('date') ||
		lowerKey.includes('before') ||
		lowerKey.includes('after') ||
		lowerKey.includes('first') ||
		lowerKey.includes('last')
	) {
		return {
			type: 'date',
			description: generateDescription(key, entityType),
			examples: [`${key}2024-01-01`, `${key}2024-12-31`]
		};
	}

	// Default to text
	return {
		type: 'text',
		description: generateDescription(key, entityType),
		examples: [`${key}example`, `${key}"Multi Word"`]
	};
}

/**
 * Generate a human-readable description for a filter key
 */
function generateDescription(key: string, entityType: string): string {
	const cleanKey = key.replace(/:$/, '').toLowerCase();

	const descriptions: Record<string, string> = {
		id: `Filter by ${entityType} ID`,
		title: `Filter by ${entityType} title`,
		description: `Filter by ${entityType} description`,
		group: `Filter by ${entityType} group`,
		single: `Filter by ${entityType} single value`,
		accountgroup: 'Filter by account group',
		combinedtitle: 'Filter by combined title',
		combined: 'Filter by combined title',
		group1: 'Filter by account group level 1',
		group2: 'Filter by account group level 2',
		group3: 'Filter by account group level 3',
		networth: 'Filter for net worth accounts',
		nw: 'Filter for net worth accounts',
		cash: 'Filter for cash accounts',
		status: 'Filter by status',
		disabled: `Filter for disabled ${entityType}s`,
		active: `Filter for active ${entityType}s`,
		allowupdate: 'Filter by update permission',
		import: 'Filter by import ID',
		importid: 'Filter by import ID',
		importdetail: 'Filter by import detail ID',
		min: 'Filter by minimum amount',
		max: 'Filter by maximum amount',
		mincount: 'Filter by minimum count',
		maxcount: 'Filter by maximum count',
		minlast: 'Filter by minimum last date',
		maxlast: 'Filter by maximum last date',
		minfirst: 'Filter by minimum first date',
		maxfirst: 'Filter by maximum first date',
		file: `Filter for ${entityType}s with files`,
		files: `Filter for ${entityType}s with files`,
		note: `Filter for ${entityType}s with notes`,
		notes: `Filter for ${entityType}s with notes`,
		reminder: `Filter for ${entityType}s with reminders`,
		reminders: `Filter for ${entityType}s with reminders`,
		startafter: 'Filter by start date after',
		startbefore: 'Filter by start date before',
		endafter: 'Filter by end date after',
		endbefore: 'Filter by end date before'
	};

	return descriptions[cleanKey] || `Filter by ${cleanKey}`;
}
