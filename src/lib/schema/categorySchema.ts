import { z } from 'zod';
import { statusEnum } from './statusSchema';

export const createCategorySchema = z.object({
	title: z.string(),
	status: z.enum(statusEnum).default('active')
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
