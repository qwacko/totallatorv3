import { z } from 'zod';
import { statusEnum } from './statusSchema';

export const createLabelSchema = z.object({
	title: z.string(),
	status: z.enum(statusEnum).default('active')
});

export type CreateLabelSchemaSuperType = typeof createLabelSchema;
export type CreateLabelSchemaType = z.infer<typeof createLabelSchema>;

export const updateLabelSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	status: z.enum(statusEnum).optional()
});

export type UpdateLabelSchemaSuperType = typeof updateLabelSchema;
export type UpdateLabelSchemaType = z.infer<typeof updateLabelSchema>;

const orderByEnum = ['title', 'status', 'deleted', 'disabled', 'allowUpdate', 'active'] as const;

type OrderByEnumType = (typeof orderByEnum)[number];

type OrderByEnumTitles = {
	[K in OrderByEnumType]: string;
};

// This will be valid for demonstration purposes
const enumTitles: OrderByEnumTitles = {
	title: 'Title',
	active: 'Active',
	allowUpdate: 'Allow Update',
	status: 'Status',
	deleted: 'Deleted',
	disabled: 'Disabled'
};

export const labelOrderByEnumToText = (input: OrderByEnumType) => {
	return enumTitles[input];
};

export const labelFilterSchema = z.object({
	id: z.string().optional(),
	idArray: z.array(z.string()).optional(),
	title: z.coerce.string().optional(),
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

export type LabelFilterSchemaType = z.infer<typeof labelFilterSchema>;
