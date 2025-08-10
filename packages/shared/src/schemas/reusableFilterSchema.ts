import * as z from 'zod';
import { journalFilterSchema, updateJournalSchema } from './journalSchema.js';

export const reusableFilterModifcationType = ['replace', 'modify'] as const;
type reusableFilterModifcationType = (typeof reusableFilterModifcationType)[number];
export const reusableFilterModifcationTypeItems: {
	value: reusableFilterModifcationType;
	name: string;
}[] = [
	{ value: 'replace', name: 'Replace' },
	{ value: 'modify', name: 'Modify' }
];

export const createReusableFilterCoreSchema = z.object({
	title: z.string().optional(),
	group: z.string().optional(),
	applyAutomatically: z.boolean().optional(),
	applyFollowingImport: z.boolean().optional(),
	listed: z.boolean().optional(),
	modificationType: z.enum(reusableFilterModifcationType).default('replace').optional()
});

export const reusableFilterCreationURLParams = z.object({
	filter: journalFilterSchema.optional(),
	change: updateJournalSchema.optional(),
	title: z.coerce.string<string>().optional(),
	group: z.coerce.string<string>().optional().nullable(),
	applyAutomatically: z.boolean().optional(),
	applyFollowingImport: z.boolean().optional(),
	listed: z.boolean().optional(),
	modificationType: z.enum(reusableFilterModifcationType).default('replace').optional()
});

export const createReusableFilterFormSchema = z.object({
	...createReusableFilterCoreSchema.shape,

	filter: z.string(),
	change: z.string().optional()
});

export type CreateReusableFilterFormSuperSchema = typeof createReusableFilterFormSchema;
export type CreateReusableFilterFormSchemaType = z.infer<typeof createReusableFilterFormSchema>;

export const createReusableFilterSchema = z.object({
	...createReusableFilterCoreSchema.shape,

	filter: journalFilterSchema,
	change: updateJournalSchema.optional()
});

export type CreateReusableFilterSchemaCoreType = typeof createReusableFilterSchema;
export type CreateReusableFilterSchemaType = z.infer<CreateReusableFilterSchemaCoreType>;

export const updateReusableFilterFormSchema = z.object({
	...createReusableFilterFormSchema.partial().shape,
	id: z.string()
});

export const updateReusableFilterSchema = createReusableFilterSchema.partial();

export type UpdateReusableFilterFormSuperSchema = typeof updateReusableFilterFormSchema;
export type UpdateReusableFilterFormSchemaType = z.infer<typeof updateReusableFilterFormSchema>;
export type UpdateReuableFilterSchemaCoreType = typeof updateReusableFilterSchema;
export type updateReusableFilterSchemaType = z.infer<UpdateReuableFilterSchemaCoreType>;

const orderByEnum = [
	'title',
	'group',
	'applyAutomatically',
	'applyFollowingImport',
	'listed',
	'filterText',
	'changeText',
	'modificationType',
	'journalCount',
	'canApply'
] as const;

type OrderByEnumType = (typeof orderByEnum)[number];

type OrderByEnumTitles = {
	[K in OrderByEnumType]: string;
};

// This will be valid for demonstration purposes
const enumTitles = {
	title: 'Title',
	group: 'Group',
	applyAutomatically: 'Apply Automatically',
	applyFollowingImport: 'Apply Following Import',
	listed: 'Listed',
	filterText: 'Filter',
	changeText: 'Change',
	modificationType: 'Modification Type',
	journalCount: 'Journal Count',
	canApply: 'Can Apply'
} satisfies OrderByEnumTitles;

export const resuableFilterOrderByEnumToText = (input: OrderByEnumType) => {
	return enumTitles[input];
};

export const reusableFilterFilterSchema = z.object({
	id: z.string().optional(),
	idArray: z.array(z.string()).optional(),
	title: z.coerce.string<string>().optional(),
	titleNot: z.coerce.string<string>().optional(),
	group: z.coerce.string<string>().optional(),
	groupNot: z.coerce.string<string>().optional(),
	multipleText: z.coerce.string<string>().optional(),
	applyAutomatically: z.boolean().optional(),
	applyFollowingImport: z.boolean().optional(),
	listed: z.boolean().optional(),
	modificationType: z.enum(reusableFilterModifcationType).optional(),
	filterText: z.coerce.string<string>().optional(),
	filterTextNot: z.coerce.string<string>().optional(),
	changeText: z.coerce.string<string>().optional(),
	changeTextNot: z.coerce.string<string>().optional(),

	//Page Information
	page: z.number().default(0).optional(),
	pageSize: z.number().default(10).optional(),
	orderBy: z
		.array(z.object({ field: z.enum(orderByEnum), direction: z.enum(['asc', 'desc']) }))
		.default([{ direction: 'asc', field: 'title' }])
		.optional()
});

export type ReusableFilterFilterSchemaType = z.infer<typeof reusableFilterFilterSchema>;
