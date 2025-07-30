import * as z from 'zod';
import { statusEnum } from './statusSchema.js';
import { summaryEnumTitles, summaryFilterProperties, summaryOrderByEnum } from './summarySchema.js';
import { linkedFileFilterSchema } from './linkedFileFilterSchema.js';
import { linkedNoteFilterSchema } from './linkedNoteFilterSchema.js';

export const createTagSchema = z.object({
	title: z.string(),
	status: z.enum(statusEnum).default('active'),
	importId: z.coerce.string<string>().optional(),
	importDetailId: z.coerce.string<string>().optional()
});

export type CreateTagSchemaType = z.infer<typeof createTagSchema>;

export const updateTagSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	status: z.enum(statusEnum).optional()
});

export type UpdateTagSchemaType = z.infer<typeof updateTagSchema>;

const orderByEnum = [
	'title',
	'group',
	'single',
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
const enumTitles = {
	title: 'Title',
	active: 'Active',
	allowUpdate: 'Allow Update',
	disabled: 'Disabled',
	group: 'Group',
	single: 'Single',
	status: 'Status',
	...summaryEnumTitles
} satisfies OrderByEnumTitles;

export const tagOrderByEnumToText = (input: OrderByEnumType) => {
	return enumTitles[input];
};

export const tagFilterSchema = z.object({
	textFilter: z.string().optional(),
	id: z.string().optional(),
	idArray: z.array(z.string()).optional(),
	excludeIdArray: z.array(z.string()).optional(),
	title: z.coerce.string<string>().optional(),
	titleArray: z.array(z.coerce.string<string>()).optional(),
	excludeTitleArray: z.array(z.coerce.string<string>()).optional(),
	group: z.coerce.string<string>().optional(),
	groupArray: z.array(z.coerce.string<string>()).optional(),
	excludeGroupArray: z.array(z.coerce.string<string>()).optional(),
	single: z.coerce.string<string>().optional(),
	singleArray: z.array(z.coerce.string<string>()).optional(),
	excludeSingleArray: z.array(z.coerce.string<string>()).optional(),
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

	//Page Information
	page: z.number().default(0).optional(),
	pageSize: z.number().default(10).optional(),
	orderBy: z
		.array(z.object({ field: z.enum(orderByEnum), direction: z.enum(['asc', 'desc']) }))
		.default([{ direction: 'asc', field: 'title' }])
		.optional(),
	...linkedFileFilterSchema.shape,
	...linkedNoteFilterSchema.shape
});

export type TagFilterSchemaType = z.infer<typeof tagFilterSchema>;
export type TagFilterSchemaWithoutPaginationType = Omit<
	TagFilterSchemaType,
	'page' | 'pageSize' | 'orderBy'
>;
