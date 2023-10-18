import { z } from 'zod';
import { statusEnum } from './statusSchema';

export const createBudgetSchema = z.object({
	title: z.string(),
	status: z.enum(statusEnum).default('active'),
	importId: z.coerce.string().optional(),
	importDetailId: z.coerce.string().optional()
});

export type CreateBudgetSchemaSuperType = typeof createBudgetSchema;
export type CreateBudgetSchemaType = z.infer<typeof createBudgetSchema>;

export const updateBudgetSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	status: z.enum(statusEnum).optional()
});

export type UpdateBudgetSchemaSuperType = typeof updateBudgetSchema;
export type UpdateBudgetSchemaType = z.infer<typeof updateBudgetSchema>;

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
	deleted: 'Deleted',
	disabled: 'Disabled',
	status: 'Status'
};

export const budgetOrderByEnumToText = (input: OrderByEnumType) => {
	return enumTitles[input];
};

export const budgetFilterSchema = z.object({
	id: z.string().optional(),
	idArray: z.array(z.string()).optional(),
	title: z.coerce.string().optional(),
	status: z.enum(statusEnum).optional(),
	deleted: z.boolean().default(false).optional(),
	disabled: z.boolean().optional(),
	allowUpdate: z.boolean().optional(),
	active: z.boolean().optional(),
	importIdArray: z.array(z.string()).optional(),
	importDetailIdArray: z.array(z.string()).optional(),
	page: z.number().default(0).optional(),
	pageSize: z.number().default(10).optional(),
	orderBy: z
		.array(z.object({ field: z.enum(orderByEnum), direction: z.enum(['asc', 'desc']) }))
		.default([{ direction: 'asc', field: 'title' }])
		.optional()
});

export type BudgetFilterSchemaType = z.infer<typeof budgetFilterSchema>;
