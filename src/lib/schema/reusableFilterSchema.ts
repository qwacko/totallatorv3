import { z } from 'zod';
import { journalFilterSchema, updateJournalSchema } from './journalSchema';

export const reusableFilterFrequencyEnum = ['5min', 'hourly', 'daily'] as const;
export const reusableFilterModifcationType = ['replace', 'modify'] as const;

export const createReusableFilterSchema = z.object({
	title: z.string().optional(),
	applyAutomatically: z.boolean().optional(),
	applyFollowingImport: z.boolean().optional(),
	automaticFrequency: z.enum(reusableFilterFrequencyEnum).optional(),
	listed: z.boolean().optional(),
	modificationType: z.enum(reusableFilterModifcationType).default('replace').optional(),
	filter: journalFilterSchema,
	change: updateJournalSchema.optional()
});

export type CreateReusableFilterSchemaCoreType = typeof createReusableFilterSchema;
export type CreateReusableFilterSchemaType = z.infer<CreateReusableFilterSchemaCoreType>;

export const updateReusableFilterSchema = createReusableFilterSchema.partial().extend({
	useFilterTextForTitle: z.boolean().optional()
});

export type UpdateReuableFilterSchemaCoreType = typeof updateReusableFilterSchema;
export type updateReusableFilterSchemaType = z.infer<UpdateReuableFilterSchemaCoreType>;

const orderByEnum = [
	'title',
	'applyAutomatically',
	'applyFollowingImport',
	'automaticFrequency',
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
	applyAutomatically: 'Apply Automatically',
	applyFollowingImport: 'Apply Following Import',
	automaticFrequency: 'Automatic Frequency',
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
	multipleText: z.coerce.string().optional(),
	applyAutomatically: z.boolean().optional(),
	applyFollowingImport: z.boolean().optional(),
	automaticFrequency: z.enum(reusableFilterFrequencyEnum).optional(),
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
