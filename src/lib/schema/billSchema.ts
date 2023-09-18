import { z } from 'zod';
import { statusEnum } from './statusSchema';

export const createBillSchema = z.object({
	title: z.string(),
	status: z.enum(statusEnum).default('active')
});

export type CreateBillSchemaSuperType = typeof createBillSchema;
export type CreateBillSchemaType = z.infer<typeof createBillSchema>;

export const updateBillSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	status: z.enum(statusEnum).optional()
});

export type UpdateBillSchemaSuperType = typeof updateBillSchema;
export type UpdateBillSchemaType = z.infer<typeof updateBillSchema>;

const orderByEnum = ['title', 'status', 'deleted', 'disabled', 'allowUpdate', 'active'] as const;

export const billFilterSchema = z.object({
	id: z.string().optional(),
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

export type BillFilterSchemaType = z.infer<typeof billFilterSchema>;
