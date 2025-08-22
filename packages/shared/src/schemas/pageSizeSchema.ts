import * as z from 'zod';

export const pageSizeEnum = ['sm', 'lg', 'xs', 'xl'] as const;

export type PageSizeIds = (typeof pageSizeEnum)[number];

export const pageSizeDropdown = [
	{ id: 'sm', title: 'Small' },
	{ id: 'lg', title: 'Large' },
	{ id: 'xs', title: 'Extra Small' },
	{ id: 'xl', title: 'Extra Large' }
];

export const pageSizeSchema = z.enum(pageSizeEnum);
