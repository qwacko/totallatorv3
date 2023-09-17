import { z } from 'zod';
import { statusEnum } from './statusSchema';
import { accountTypeEnum } from './accountTypeSchema';
import { dateStringSchema } from './dateStringSchema';

export const createAccountSchema = z.object({
	title: z.string(),
	accountGroupCombined: z.string(),
	type: z.enum(accountTypeEnum).optional().default('expense'),
	startDate: dateStringSchema.optional(),
	endDate: dateStringSchema.optional(),
	isCash: z.boolean().optional(),
	isNetWorth: z.boolean().optional(),
	status: z.enum(statusEnum).default('active')
});

export type CreateAccountSchemaSuperType = typeof createAccountSchema;
export type CreateAccountSchemaType = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	type: z.enum(accountTypeEnum).optional(),
	accountGroupCombined: z.string().optional(),
	startDate: dateStringSchema.optional().nullable(),
	endDate: dateStringSchema.optional().nullable(),
	isCash: z.boolean().optional(),
	isNetWorth: z.boolean().optional(),
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
	'isCash',
	'isNetWorth',
	'startDate',
	'endDate',
	'status',
	'deleted',
	'disabled',
	'allowUpdate',
	'active'
] as const;

export const accountFilterSchema = z.object({
	id: z.string().optional(),
	title: z.string().optional(),
	type: z.array(z.enum(accountTypeEnum)).optional(),
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
	isCash: z.boolean().optional(),
	isNetWorth: z.boolean().optional(),
	startDateBefore: dateStringSchema.optional(),
	startDateAfter: dateStringSchema.optional(),
	endDateBefore: dateStringSchema.optional(),
	endDateAfter: dateStringSchema.optional(),
	page: z.number().default(0).optional(),
	pageSize: z.number().default(10).optional(),
	orderBy: z
		.array(z.object({ field: z.enum(orderByEnum), direction: z.enum(['asc', 'desc']) }))
		.default([{ direction: 'asc', field: 'title' }])
		.optional()
});

export type AccountFilterSchemaType = z.infer<typeof accountFilterSchema>;
