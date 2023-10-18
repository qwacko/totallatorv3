import { z } from 'zod';
import { statusEnum } from './statusSchema';

export const createCategorySchema = z.object({
	title: z.string(),
	status: z.enum(statusEnum).default('active'),
	importId: z.coerce.string().optional(),
	importDetailId: z.coerce.string().optional()
});

export type CreateCategorySchemaSuperType = typeof createCategorySchema;
export type CreateCategorySchemaType = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	status: z.enum(statusEnum).optional()
});

export type UpdateCategorySchemaSuperType = typeof updateCategorySchema;
export type UpdateCategorySchemaType = z.infer<typeof updateCategorySchema>;

const orderByEnum = [
	'title',
	'group',
	'single',
	'status',
	'deleted',
	'disabled',
	'allowUpdate',
	'active'
] as const;

type OrderByEnumType = (typeof orderByEnum)[number];

type OrderByEnumTitles = {
	[K in OrderByEnumType]: string;
};

// This will be valid for demonstration purposes
const enumTitles: OrderByEnumTitles = {
	title: 'Title',
	active: 'Active',
	allowUpdate: 'Allow Update',
	deleted: 'Deleted',
	disabled: 'Disabled',
	group: 'Group',
	single: 'Single',
	status: 'Status'
};

export const categoryOrderByEnumToText = (input: OrderByEnumType) => {
	return enumTitles[input];
};

export const categoryFilterSchema = z.object({
	id: z.string().optional(),
	idArray: z.array(z.string()).optional(),
	title: z.coerce.string().optional(),
	group: z.coerce.string().optional(),
	single: z.coerce.string().optional(),
	status: z.enum(statusEnum).optional(),
	deleted: z.boolean().default(false).optional(),
	disabled: z.boolean().optional(),
	allowUpdate: z.boolean().optional(),
	active: z.boolean().optional(),
	page: z.number().default(0).optional(),
	pageSize: z.number().default(10).optional(),
	orderBy: z
		.array(z.object({ field: z.enum(orderByEnum), direction: z.enum(['asc', 'desc']) }))
		.default([{ direction: 'asc', field: 'title' }])
		.optional()
});

export type CategoryFilterSchemaType = z.infer<typeof categoryFilterSchema>;
