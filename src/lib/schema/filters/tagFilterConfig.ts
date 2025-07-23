import { statusEnum } from '../statusSchema';
import { type FilterConfiguration, filterConfigToAutocomplete, type AutocompleteKey } from '../textFilterSchema';

export const tagFilterConfiguration: FilterConfiguration = {
	keys: [
		// Basic tag fields
		{
			keys: ['id:'],
			description: 'Filter by tag ID',
			invertable: true,
			type: 'text',
			examples: ['id:abc123']
		},
		{
			keys: ['title:', 'description:'],
			description: 'Filter by tag title or description',
			invertable: true,
			type: 'text',
			examples: ['title:"Groceries"', 'description:food']
		},
		{
			keys: ['group:'],
			description: 'Filter by tag group',
			invertable: true,
			type: 'text',
			examples: ['group:personal', 'group:"Business Expenses"']
		},
		{
			keys: ['single:'],
			description: 'Filter by tag single value',
			invertable: true,
			type: 'text',
			examples: ['single:food', 'single:"Entertainment"']
		},

		// Status filters
		{
			keys: ['status:'],
			description: 'Filter by status',
			invertable: true,
			type: 'enum',
			enumValues: [...statusEnum],
			examples: ['status:active', 'status:disabled']
		},
		{
			keys: ['disabled:'],
			description: 'Filter for disabled tags only',
			invertable: true,
			type: 'boolean',
			examples: ['disabled:', '!disabled:']
		},
		{
			keys: ['active:'],
			description: 'Filter for active tags only',
			invertable: true,
			type: 'boolean',
			examples: ['active:', '!active:']
		},
		{
			keys: ['allowupdate:'],
			description: 'Filter by whether updates are allowed',
			invertable: true,
			type: 'boolean',
			examples: ['allowupdate:', '!allowupdate:']
		},

		// Import filters
		{
			keys: ['importDetailId:', 'importDetail:'],
			description: 'Filter by import detail ID',
			invertable: true,
			type: 'text',
			examples: ['importDetail:123', 'importDetailId:abc']
		},
		{
			keys: ['importId:', 'import:'],
			description: 'Filter by import ID',
			invertable: true,
			type: 'text',
			examples: ['import:456', 'importId:def']
		},

		// Statistics filters
		{
			keys: ['min:', 'mintotal:', 'totalmin:'],
			description: 'Filter by minimum total amount',
			invertable: true,
			type: 'number',
			examples: ['min:100', 'mintotal:50.25']
		},
		{
			keys: ['max:', 'maxtotal:', 'totalmax:'],
			description: 'Filter by maximum total amount',
			invertable: true,
			type: 'number',
			examples: ['max:1000', 'maxtotal:500.75']
		},
		{
			keys: ['mincount:', 'countmin:'],
			description: 'Filter by minimum count',
			invertable: true,
			type: 'number',
			examples: ['mincount:5', 'countmin:10']
		},
		{
			keys: ['maxcount:', 'countmax:'],
			description: 'Filter by maximum count',
			invertable: true,
			type: 'number',
			examples: ['maxcount:100', 'countmax:50']
		},
		{
			keys: ['minlast:', 'lastmin:'],
			description: 'Filter by minimum last date',
			invertable: true,
			type: 'date',
			examples: ['minlast:2024-01-01', 'lastmin:2024-05-15']
		},
		{
			keys: ['maxlast:', 'lastmax:'],
			description: 'Filter by maximum last date',
			invertable: true,
			type: 'date',
			examples: ['maxlast:2024-12-31', 'lastmax:2024-06-30']
		},
		{
			keys: ['minfirst:', 'firstmin:'],
			description: 'Filter by minimum first date',
			invertable: true,
			type: 'date',
			examples: ['minfirst:2024-01-01', 'firstmin:2023-12-01']
		},
		{
			keys: ['maxfirst:', 'firstmax:'],
			description: 'Filter by maximum first date',
			invertable: true,
			type: 'date',
			examples: ['maxfirst:2024-12-31', 'firstmax:2024-07-15']
		},

		// File association filters
		{
			keys: ['file:', 'files:'],
			description: 'Filter for tags with files',
			invertable: true,
			type: 'boolean',
			examples: ['file:', '!files:']
		},

		// Note association filters
		{
			keys: ['note:', 'notes:'],
			description: 'Filter for tags with notes',
			invertable: true,
			type: 'boolean',
			examples: ['note:', '!notes:']
		},
		{
			keys: ['reminder:', 'reminders:'],
			description: 'Filter for tags with reminders',
			invertable: true,
			type: 'boolean',
			examples: ['reminder:', '!reminders:']
		}
	],
	defaultFields: ['titleArray'],
	defaultExcludeFields: ['excludeTitleArray']
};

// Export autocomplete keys for SearchInput component
export const tagAutocompleteKeys: AutocompleteKey[] = filterConfigToAutocomplete(tagFilterConfiguration);