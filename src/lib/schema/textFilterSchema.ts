import { z } from 'zod';

// Data types that can be filtered
export const filterValueTypeEnum = z.enum(['text', 'number', 'date', 'boolean', 'enum']);
export type FilterValueType = z.infer<typeof filterValueTypeEnum>;

// Base definition for a filter key
export const filterKeyDefinitionSchema = z.object({
	// The key(s) used in text filters (e.g., "title:", "group:")
	keys: z.array(z.string()).min(1),
	// Human readable description for autocomplete
	description: z.string(),
	// Whether this key can be negated with ! prefix
	invertable: z.boolean().default(true),
	// Data type for validation and autocomplete
	type: filterValueTypeEnum,
	// For enum types, the allowed values
	enumValues: z.array(z.string()).optional(),
	// Examples to show in autocomplete
	examples: z.array(z.string()).optional()
});

export type FilterKeyDefinition = z.infer<typeof filterKeyDefinitionSchema>;

// Collection of filter keys for an entity
export const filterConfigurationSchema = z.object({
	// All available filter keys for this entity
	keys: z.array(filterKeyDefinitionSchema),
	// Default search fields when no key is specified
	defaultFields: z.array(z.string()).optional(),
	// Default exclude fields when ! is used without key
	defaultExcludeFields: z.array(z.string()).optional()
});

export type FilterConfiguration = z.infer<typeof filterConfigurationSchema>;

// Helper type for autocomplete components
export type AutocompleteKey = {
	key: string;
	desc: string;
	invertable: boolean;
	type: FilterValueType;
	enumValues?: string[];
	examples?: string[];
};

// Convert FilterKeyDefinition to AutocompleteKey format
export function filterKeyToAutocomplete(filterKey: FilterKeyDefinition): AutocompleteKey[] {
	return filterKey.keys.map((key) => ({
		key,
		desc: filterKey.description,
		invertable: filterKey.invertable,
		type: filterKey.type,
		enumValues: filterKey.enumValues,
		examples: filterKey.examples
	}));
}

// Convert entire FilterConfiguration to array of AutocompleteKeys
export function filterConfigToAutocomplete(config: FilterConfiguration): AutocompleteKey[] {
	return config.keys.flatMap(filterKeyToAutocomplete);
}