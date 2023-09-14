import { z } from 'zod';
import { statusEnum, statusEnumWithoutDeleted } from './statusSchema';

export const createTagSchema = z.object({
	title: z.string().optional(),
	status: z.enum(statusEnum).default('active')
});

export type CreateTagSchemaType = z.infer<typeof createTagSchema>;

export const updateTagSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	status: z.enum(statusEnumWithoutDeleted).optional()
});

export type UpdateTagSchemaType = z.infer<typeof updateTagSchema>;

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

export const tagFilterSchema = z.object({
	id: z.string().optional(),
	title: z.string().optional(),
	group: z.string().optional(),
	single: z.string().optional(),
	status: z.enum(statusEnum).optional(),
	deleted: z.boolean().optional().default(false),
	disabled: z.boolean().optional(),
	allowUpdate: z.boolean().optional(),
	active: z.boolean().optional(),
	page: z.number().default(0),
	pageSize: z.number().default(10),
	orderBy: z
		.array(z.object({ field: z.enum(orderByEnum), direction: z.enum(['asc', 'desc']) }))
		.optional()
		.default([{ direction: 'asc', field: 'title' }])
});

export type TagFilterSchemaType = z.infer<typeof tagFilterSchema>;
