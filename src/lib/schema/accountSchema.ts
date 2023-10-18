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
	status: z.enum(statusEnum).default('active'),
	importId: z.coerce.string().optional(),
	importDetailId: z.coerce.string().optional()
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

export const accountOrderByEnum = [
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

type OrderByEnumType = (typeof accountOrderByEnum)[number];

type OrderByEnumTitles = {
	[K in OrderByEnumType]: string;
};

// This will be valid for demonstration purposes
const enumTitles: OrderByEnumTitles = {
	title: 'Title',
	accountGroup: 'Account Group',
	accountGroup2: 'Account Group 2',
	accountGroup3: 'Account Group 3',
	accountGroupCombined: 'Account Group Combined',
	accountTitleCombined: 'Account Title Combined',
	isCash: 'Is Cash',
	isNetWorth: 'Is Net Worth',
	startDate: 'Start Date',
	endDate: 'End Date',
	status: 'Status',
	deleted: 'Deleted',
	disabled: 'Disabled',
	allowUpdate: 'Allow Update',
	active: 'Active'
};

export const accountOrderByEnumToText = (input: OrderByEnumType) => {
	return enumTitles[input];
};

export const accountFilterSchema = z.object({
	id: z.string().optional(),
	idArray: z.array(z.string()).optional(),
	title: z.coerce.string().optional(),
	type: z
		.array(z.enum(accountTypeEnum))
		.optional()
		.transform((e) => (e && e.length === 0 ? undefined : e)),
	accountGroup: z.coerce.string().optional(),
	accountGroup2: z.coerce.string().optional(),
	accountGroup3: z.coerce.string().optional(),
	accountGroupCombined: z.coerce.string().optional(),
	accountTitleCombined: z.coerce.string().optional(),
	status: z.enum(statusEnum).optional(),
	deleted: z.boolean().default(false).optional(),
	disabled: z.boolean().optional(),
	allowUpdate: z.boolean().optional(),
	active: z.boolean().optional(),
	isCash: z.coerce.boolean().optional(),
	isNetWorth: z.coerce.boolean().optional(),
	startDateBefore: dateStringSchema.optional(),
	startDateAfter: dateStringSchema.optional(),
	endDateBefore: dateStringSchema.optional(),
	endDateAfter: dateStringSchema.optional(),
	importIdArray: z.array(z.string()).optional(),
	importDetailIdArray: z.array(z.string()).optional(),
	page: z.coerce.number().default(0).optional(),
	pageSize: z.coerce.number().default(10).optional(),

	orderBy: z
		.array(z.object({ field: z.enum(accountOrderByEnum), direction: z.enum(['asc', 'desc']) }))
		.default([{ direction: 'asc', field: 'title' }])
		.optional()
});

export type AccountFilterSchemaType = z.infer<typeof accountFilterSchema>;
