import { z } from 'zod';
import { statusEnum } from './statusSchema';

export const createAccountSchema = z.object({
	title: z.string(),
	accountGroupCombined: z.string(),
	status: z.enum(statusEnum).default('active')
});

export type CreateAccountSchemaSuperType = typeof createAccountSchema;
export type CreateAccountSchemaType = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	accountGroupCombined: z.string().optional(),
	status: z.enum(statusEnum).optional()
});

export type UpdateAccountSchemaSuperType = typeof updateAccountSchema;
export type UpdateAccountSchemaType = z.infer<typeof updateAccountSchema>;

const orderByEnum = [
	'title',
	'accountGroup',
	'accountGroup2',
	'accountGroup3',
	'accountGroupCombined',
	'accountTitleCombined',
	'status',
	'deleted',
	'disabled',
	'allowUpdate',
	'active'
] as const;

export const accountFilterSchema = z.object({
	id: z.string().optional(),
	title: z.string().optional(),
	accountGroup: z.string().optional(),
	accountGroup2: z.string().optional(),
	accountGroup3: z.string().optional(),
	accountGroupCombined: z.string().optional(),
	accountTitleCombined: z.string().optional(),
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

export type AccountFilterSchemaType = z.infer<typeof accountFilterSchema>;
