import { z } from 'zod';
import { journalFilterSchema, updateJournalSchema } from './journalSchema';

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

export const reusableFilterCreationURLParams = z
	.object({
		filter: journalFilterSchema.optional(),
		change: updateJournalSchema.optional(),
		title: z.coerce.string().optional(),
		group: z.coerce.string().optional().nullable(),
		applyAutomatically: z.boolean().optional(),
		applyFollowingImport: z.boolean().optional(),
		listed: z.boolean().optional(),
		modificationType: z.enum(reusableFilterModifcationType).default('replace').optional()
	})
	.superRefine((data) => console.log('Filter Data', data));

export const createReusableFilterFormSchema = createReusableFilterCoreSchema.merge(
	z.object({
		filter: z.string(),
		change: z.string().optional()
	})
);

export type CreateReusableFilterFormSuperSchema = typeof createReusableFilterFormSchema;
export type CreateReusableFilterFormSchemaType = z.infer<typeof createReusableFilterFormSchema>;

export const createReusableFilterSchema = createReusableFilterCoreSchema.merge(
	z.object({
		filter: journalFilterSchema,
		change: updateJournalSchema.optional()
	})
);

export type CreateReusableFilterSchemaCoreType = typeof createReusableFilterSchema;
export type CreateReusableFilterSchemaType = z.infer<CreateReusableFilterSchemaCoreType>;

export const updateReusableFilterFormSchema = createReusableFilterFormSchema.partial().extend({
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
	'modificationType'
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
	modificationType: 'Modification Type'
} satisfies OrderByEnumTitles;

export const resuableFilterOrderByEnumToText = (input: OrderByEnumType) => {
	return enumTitles[input];
};

export const reusableFilterFilterSchema = z.object({
	id: z.string().optional(),
	idArray: z.array(z.string()).optional(),
	title: z.coerce.string().optional(),
	group: z.coerce.string().optional(),
	multipleText: z.coerce.string().optional(),
	applyAutomatically: z.boolean().optional(),
	applyFollowingImport: z.boolean().optional(),
	listed: z.boolean().optional(),
	modificationType: z.enum(reusableFilterModifcationType).optional(),
	filterText: z.coerce.string().optional(),
	changeText: z.coerce.string().optional(),

	//Page Information
	page: z.number().default(0).optional(),
	pageSize: z.number().default(10).optional(),
	orderBy: z
		.array(z.object({ field: z.enum(orderByEnum), direction: z.enum(['asc', 'desc']) }))
		.default([{ direction: 'asc', field: 'title' }])
		.optional()
});

export type ReusableFilterFilterSchemaType = z.infer<typeof reusableFilterFilterSchema>;
