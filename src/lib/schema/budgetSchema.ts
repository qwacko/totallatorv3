import { z } from 'zod';
import { statusEnum } from './statusSchema';
import { summaryEnumTitles, summaryFilterProperties, summaryOrderByEnum } from './summarySchema';
import { linkedFileFilterSchema } from './linkedFileFilterSchema';
import { linkedNoteFilterSchema } from './linkedNoteFilterSchema';

export const createBudgetSchema = z.object({
	title: z.string(),
	status: z.enum(statusEnum).default('active'),
	importId: z.coerce.string().optional(),
	importDetailId: z.coerce.string().optional()
});

export type CreateBudgetSchemaType = z.infer<typeof createBudgetSchema>;

export const updateBudgetSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	status: z.enum(statusEnum).optional()
});

export type UpdateBudgetSchemaType = z.infer<typeof updateBudgetSchema>;

const orderByEnum = [
	'title',
	'status',
	'disabled',
	'allowUpdate',
	'active',
	...summaryOrderByEnum
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
	disabled: 'Disabled',
	status: 'Status',
	...summaryEnumTitles
};

export const budgetOrderByEnumToText = (input: OrderByEnumType) => {
	return enumTitles[input];
};

export const budgetFilterSchema = z
	.object({
		textFilter: z.string().optional(),
		id: z.string().optional(),
		idArray: z.array(z.string()).optional(),
		excludeIdArray: z.array(z.string()).optional(),
		title: z.coerce.string().optional(),
		titleArray: z.array(z.coerce.string()).optional(),
		excludeTitleArray: z.array(z.coerce.string()).optional(),
		status: z.enum(statusEnum).optional(),
		statusArray: z.array(z.enum(statusEnum)).optional(),
		excludeStatusArray: z.array(z.enum(statusEnum)).optional(),
		disabled: z.boolean().optional(),
		allowUpdate: z.boolean().optional(),
		active: z.boolean().optional(),
		importIdArray: z.array(z.string()).optional(),
		excludeImportIdArray: z.array(z.string()).optional(),
		importDetailIdArray: z.array(z.string()).optional(),
		excludeImportDetailIdArray: z.array(z.string()).optional(),

		//Summary Info Filters
		...summaryFilterProperties,

		page: z.coerce.number().default(0).optional(),
		pageSize: z.coerce.number().default(10).optional(),

		orderBy: z
			.array(z.object({ field: z.enum(orderByEnum), direction: z.enum(['asc', 'desc']) }))
			.default([{ direction: 'asc', field: 'title' }])
			.optional()
	})
	.merge(linkedFileFilterSchema)
	.merge(linkedNoteFilterSchema);

export type BudgetFilterSchemaType = z.infer<typeof budgetFilterSchema>;
export type BudgetFilterSchemaWithoutPaginationType = Omit<
	BudgetFilterSchemaType,
	'page' | 'pageSize' | 'orderBy'
>;
