import { z } from 'zod';

export const importMappingDetailSchema = z.object({
	uniqueId: z.string().optional(),
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
	budgetTitle: z.string().optional()
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
	});

export type ImportMappingDetailSuperSchema = typeof importMappingDetailSchema;
export type ImportMappingDetailSchema = z.infer<ImportMappingDetailSuperSchema>;

export const importMappingCreateFormSchema = z.object({
	title: z.string(),
	configuration: z.string()
});
export type ImportMappingCreateFormSuperSchema = typeof importMappingCreateFormSchema;
export type ImportMappingCreateFormSchema = z.infer<ImportMappingCreateFormSuperSchema>;

export const importMappingUpdateFormSchema = z.object({
	title: z.string().optional(),
	configuration: z.string().optional()
});

export type ImportMappingUpdateFormSuperSchema = typeof importMappingUpdateFormSchema;
export type ImportMappingUpdateFormSchema = z.infer<ImportMappingUpdateFormSuperSchema>;