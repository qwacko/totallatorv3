import { z } from 'zod';

export const importMappingDetailSchema = z.object({
	uniqueId: z.string().optional(),
	rowsToSkip: z.number().default(0),
	date: z.string(),
	fromAccountId: z.string().optional(),
	fromAccountTitle: z.string().optional(),
	toAccountId: z.string().optional(),
	toAccountTitle: z.string().optional(),
	description: z.string(),
	amount: z.string(),
	categoryId: z.string().optional(),
	categoryTitle: z.string().optional(),
	tagId: z.string().optional(),
	tagTitle: z.string().optional(),
	billId: z.string().optional(),
	billTitle: z.string().optional(),
	budgetId: z.string().optional(),
	budgetTitle: z.string().optional(),
	labelTitles: z.string().or(z.array(z.string())).optional()
});

export const importMappingDetailWithRefinementSchema = importMappingDetailSchema
	.refine((data) => data.fromAccountId || data.fromAccountTitle, {
		message: 'Either From Account ID or From Account Title must be set',
		path: ['fromAccountTitle']
	})
	.refine((data) => data.toAccountId || data.toAccountTitle, {
		message: 'Either To Account or To Account Title must be set',
		path: ['toAccountTitle']
	})
	.refine((data) => !(data.fromAccountId && data.fromAccountTitle), {
		message: 'Either From Account ID or From Account Title must be set, not both',
		path: ['fromAccountTitle']
	})
	.refine((data) => !(data.toAccountId && data.toAccountTitle), {
		message: 'Either To Account or To Account Title must be set, not both',
		path: ['toAccountTitle']
	})
	.refine((data) => !(data.categoryId && data.categoryTitle), {
		message: 'Either Category ID or Category Title must be set, not both',
		path: ['categoryTitle']
	})
	.refine((data) => !(data.tagId && data.tagTitle), {
		message: 'Either Tag ID or Tag Title must be set, not both',
		path: ['tagTitle']
	})
	.refine((data) => !(data.billId && data.billTitle), {
		message: 'Either Bill ID or Bill Title must be set, not both',
		path: ['billTitle']
	})
	.refine((data) => !(data.budgetId && data.budgetTitle), {
		message: 'Either Budget ID or Budget Title must be set, not both',
		path: ['budgetTitle']
	})
	.transform((data) => ({
		...data,
		labelTitles: data.labelTitles
			? Array.isArray(data.labelTitles)
				? data.labelTitles.filter((title) => title.trim().length > 0)
				: data.labelTitles.trim().length > 0
					? data.labelTitles.split(',').map((title) => title.trim())
					: undefined
			: undefined
	}));

export type ImportMappingDetailSuperSchema = typeof importMappingDetailSchema;
export type ImportMappingDetailSchema = z.infer<ImportMappingDetailSuperSchema>;

export const importMappingCreateFormSchema = z.object({
	title: z.string(),
	configuration: z.string(),
	sampleData: z.string().optional()
});
export type ImportMappingCreateFormSuperSchema = typeof importMappingCreateFormSchema;
export type ImportMappingCreateFormSchema = z.infer<ImportMappingCreateFormSuperSchema>;

export const importMappingUpdateFormSchema = z.object({
	title: z.string(),
	configuration: z.string(),
	sampleData: z.string().optional()
});

export type ImportMappingUpdateFormSuperSchema = typeof importMappingUpdateFormSchema;
export type ImportMappingUpdateFormSchema = z.infer<ImportMappingUpdateFormSuperSchema>;

const orderByEnum = ['title', 'configuration'] as const;

type OrderByEnumType = (typeof orderByEnum)[number];

type OrderByEnumTitles = {
	[K in OrderByEnumType]: string;
};

// This will be valid for demonstration purposes
const enumTitles: OrderByEnumTitles = {
	title: 'Title',
	configuration: 'Configuration'
};

export const importMappingOrderByEnumToText = (input: OrderByEnumType) => {
	return enumTitles[input];
};

export const importMappingFilterSchema = z.object({
	id: z.string().optional(),
	idArray: z.array(z.string()).optional(),
	title: z.string().optional(),
	configuration: z.string().optional(),
	combinedText: z.string().optional(),
	page: z.number().default(0).optional(),
	pageSize: z.number().default(10).optional(),
	orderBy: z
		.array(z.object({ field: z.enum(orderByEnum), direction: z.enum(['asc', 'desc']) }))
		.default([{ direction: 'asc', field: 'title' }])
		.optional()
});

export type ImportMappingFilterSchema = z.infer<typeof importMappingFilterSchema>;
