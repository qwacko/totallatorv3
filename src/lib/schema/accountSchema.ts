import { z } from 'zod';
import { statusEnum } from './statusSchema';
import { accountTypeEnum } from './accountTypeSchema';
import { dateStringSchema } from './dateStringSchema';
import { summaryEnumTitles, summaryFilterProperties, summaryOrderByEnum } from './summarySchema';
import { linkedFileFilterSchema } from './linkedFileFilterSchema';
import { linkedNoteFilterSchema } from './linkedNoteFilterSchema';

export const createAccountSchema = z.object({
	title: z.string(),
	accountGroupCombined: z.string().trim(),
	type: z.enum(accountTypeEnum).optional().default('expense'),
	startDate: dateStringSchema.or(z.string().trim().length(0)).optional(),
	endDate: dateStringSchema.or(z.string().trim().length(0)).optional(),
	isCash: z.coerce.boolean().optional(),
	isNetWorth: z.coerce.boolean().optional(),
	status: z.enum(statusEnum).default('active'),
	importId: z.coerce.string().optional(),
	importDetailId: z.coerce.string().optional()
});

export type CreateAccountSchemaType = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = z.object({
	title: z.string().trim().optional(),
	type: z.enum(accountTypeEnum).optional(),
	accountGroupCombined: z.string().trim().optional(),
	accountGroupCombinedClear: z.boolean().optional(),
	accountGroup: z.string().trim().optional(),
	accountGroupClear: z.boolean().optional(),
	accountGroup2: z.string().trim().optional(),
	accountGroup2Clear: z.boolean().optional(),
	accountGroup3: z.string().trim().optional(),
	accountGroup3Clear: z.boolean().optional(),
	startDate: dateStringSchema.optional().nullable(),
	endDate: dateStringSchema.optional().nullable(),
	isCash: z.boolean().optional(),
	isNetWorth: z.boolean().optional(),
	status: z.enum(statusEnum).optional()
});

export const updateAccountSchemaWithId = updateAccountSchema.merge(z.object({ id: z.string() }));

const refineAccountUpdate = (data: {
	accountGroupCombined?: string;
	accountGroup?: string;
	accountGroup2?: string;
	accountGroup3?: string;
	accountGroupClear?: boolean;
	accountGroup2Clear?: boolean;
	accountGroup3Clear?: boolean;
}): boolean => {
	if (data.accountGroupCombined) {
		return !(
			data.accountGroup ||
			data.accountGroup2 ||
			data.accountGroup3 ||
			data.accountGroupClear === true ||
			data.accountGroup2Clear === true ||
			data.accountGroup3Clear === true
		);
	}
	return true;
};

export const updateAccountSchemaRefined = updateAccountSchema.refine(refineAccountUpdate, {
	message:
		'Account Group Combined must not be accompanied by Account Group, Account Group 2, or Account Group 3',
	path: ['accountGroupCombined']
});

export type UpdateAccountSchemaType = z.infer<typeof updateAccountSchema>;

export const accountOrderByEnum = [
	'title',
	'accountGroup',
	'accountGroup2',
	'accountGroup3',
	'accountGroupCombined',
	'accountTitleCombined',
	'type',
	'isCash',
	'isNetWorth',
	'startDate',
	'endDate',
	'status',
	'disabled',
	'allowUpdate',
	'active',
	...summaryOrderByEnum
] as const;

type OrderByEnumType = (typeof accountOrderByEnum)[number];

type OrderByEnumTitles = {
	[K in OrderByEnumType]: string;
};

// This will be valid for demonstration purposes
const enumTitles: OrderByEnumTitles = {
	title: 'Title',
	type: 'Account Type',
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
	disabled: 'Disabled',
	allowUpdate: 'Allow Update',
	active: 'Active',
	...summaryEnumTitles
};

export const accountOrderByEnumToText = (input: OrderByEnumType) => {
	return enumTitles[input];
};

export const accountFilterSchema = z
	.object({
		textFilter: z.string().optional(),
		id: z.string().optional(),
		idArray: z.array(z.string()).optional(),
		excludeIdArray: z.array(z.string()).optional(),
		title: z.coerce.string().optional(),
		titleArray: z.array(z.coerce.string()).optional(),
		excludeTitleArray: z.array(z.coerce.string()).optional(),
		type: z
			.array(z.enum(accountTypeEnum))
			.optional()
			.transform((e) => (e && e.length === 0 ? undefined : e)),
		excludeType: z
			.array(z.enum(accountTypeEnum))
			.optional()
			.transform((e) => (e && e.length === 0 ? undefined : e)),
		accountGroup: z.coerce.string().optional(),
		accountGroupArray: z.array(z.coerce.string()).optional(),
		excludeAccountGroupArray: z.array(z.coerce.string()).optional(),
		accountGroup2: z.coerce.string().optional(),
		accountGroup2Array: z.array(z.coerce.string()).optional(),
		excludeAccountGroup2Array: z.array(z.coerce.string()).optional(),
		accountGroup3: z.coerce.string().optional(),
		accountGroup3Array: z.array(z.coerce.string()).optional(),
		excludeAccountGroup3Array: z.array(z.coerce.string()).optional(),
		accountGroupCombined: z.coerce.string().optional(),
		accountGroupCombinedArray: z.array(z.string()).optional(),
		excludeAccountGroupCombinedArray: z.array(z.string()).optional(),
		accountTitleCombined: z.coerce.string().optional(),
		accountTitleCombinedArray: z.array(z.string()).optional(),
		excludeAccountTitleCombinedArray: z.array(z.string()).optional(),
		status: z.enum(statusEnum).optional(),
		statusArray: z.array(z.enum(statusEnum)).optional(),
		excludeStatusArray: z.array(z.enum(statusEnum)).optional(),
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
		excludeImportIdArray: z.array(z.string()).optional(),
		importDetailIdArray: z.array(z.string()).optional(),
		excludeImportDetailIdArray: z.array(z.string()).optional(),

		//Summary Info Filters
		...summaryFilterProperties,

		page: z.coerce.number().default(0).optional(),
		pageSize: z.coerce.number().default(10).optional(),

		orderBy: z
			.array(z.object({ field: z.enum(accountOrderByEnum), direction: z.enum(['asc', 'desc']) }))
			.default([{ direction: 'asc', field: 'title' }])
			.optional()
	})
	.merge(linkedFileFilterSchema)
	.merge(linkedNoteFilterSchema);

export type AccountFilterSchemaType = z.infer<typeof accountFilterSchema>;
export type AccountFilterSchemaWithoutPaginationType = Omit<
	AccountFilterSchemaType,
	'page' | 'pageSize' | 'orderBy'
>;
