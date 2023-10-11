import { z } from 'zod';
import { dateStringSchema } from './dateStringSchema';
import { accountFilterSchema } from './accountSchema';
import { tagFilterSchema } from './tagSchema';
import { billFilterSchema } from './billSchema';
import { budgetFilterSchema } from './budgetSchema';
import { categoryFilterSchema } from './categorySchema';
import { labelFilterSchema } from './labelSchema';

export const createJournalDBCore = z.object({
	date: dateStringSchema,
	description: z.string(),
	amount: z.number(),
	tagId: z.string().optional(),
	billId: z.string().optional(),
	budgetId: z.string().optional(),
	categoryId: z.string().optional(),
	accountId: z.string().optional(),
	labels: z.array(z.string()).optional(),
	linked: z.boolean().default(true).optional(),
	reconciled: z.boolean().default(false).optional(),
	dataChecked: z.boolean().default(false).optional(),
	complete: z.boolean().default(false).optional()
});

export type CreateJournalDBCoreType = z.infer<typeof createJournalDBCore>;

export const createJournalSchemaCore = createJournalDBCore.merge(
	z.object({
		tagTitle: z.string().optional(),
		billTitle: z.string().optional(),
		budgetTitle: z.string().optional(),
		categoryTitle: z.string().optional(),
		accountTitle: z.string().optional(),
		labelTitles: z.array(z.string()).optional()
	})
);

export const createJournalSchema = createJournalSchemaCore
	.refine((data) => data.tagId && data.tagTitle, {
		path: ['tagId'],
		message: 'tagId and tagTitle must be both present or both absent'
	})
	.refine((data) => data.billId && data.billTitle, {
		path: ['billId'],
		message: 'billId and billTitle must be both present or both absent'
	})
	.refine((data) => data.budgetId && data.budgetTitle, {
		path: ['budgetId'],
		message: 'budgetId and budgetTitle must be both present or both absent'
	})
	.refine((data) => data.categoryId && data.categoryTitle, {
		path: ['categoryId'],
		message: 'categoryId and categoryTitle must be both present or both absent'
	})
	.refine((data) => data.accountId || data.accountTitle, {
		path: ['accountId'],
		message: 'Account ID or Account Title is required'
	})
	.refine((data) => data.accountId && data.accountTitle, {
		path: ['accountId'],
		message: 'Only one of either Account ID or Account Title is allowed. Both are present.'
	});

export const createSimpleTransactionSchema = createJournalSchemaCore
	.omit({ accountId: true, accountTitle: true })
	.extend({
		fromAccoutId: z.string().optional(),
		fromAccountTitle: z.string().optional(),
		toAccountId: z.string().optional(),
		toAccountTitle: z.string().optional()
	});

export const createCombinedTransactionSchema = z
	.array(createJournalSchema)
	.refine((data) => data.length > 1, {
		path: [''],
		message: 'Combined transaction must have at least 2 transactions'
	})
	.refine(
		(data) => {
			const amountTotal = data.reduce((acc, curr) => acc + curr.amount, 0);
			return amountTotal === 0;
		},
		{ message: 'Combined transaction must have a total of 0' }
	);

export type CreateCombinedTransactionType = z.infer<typeof createCombinedTransactionSchema>;

export type CreateJournalSchemaSuperType = typeof createJournalSchema;
export type CreateJournalSchemaType = z.infer<typeof createJournalSchema>;

export const updateJournalSchema = z.object({
	previousURL: z.string().optional(),
	date: dateStringSchema.optional(),
	description: z.string().optional(),
	amount: z.number().optional(),
	tagId: z.string().nullable().optional(),
	tagTitle: z.string().nullable().optional(),
	tagClear: z.boolean().optional().default(false),
	billId: z.string().nullable().optional(),
	billTitle: z.string().nullable().optional(),
	billClear: z.boolean().optional().default(false),
	budgetId: z.string().nullable().optional(),
	budgetTitle: z.string().nullable().optional(),
	budgetClear: z.boolean().optional().default(false),
	categoryId: z.string().nullable().optional(),
	categoryTitle: z.string().nullable().optional(),
	categoryClear: z.boolean().optional().default(false),
	accountId: z.string().optional(),
	accountTitle: z.string().nullable().optional(),
	otherAccountId: z.string().optional(),
	otherAccountTitle: z.string().optional(),
	addLabels: z.array(z.string()).optional(),
	addLabelTitles: z.array(z.string()).optional(),
	removeLabels: z.array(z.string()).optional(),
	removeLabelTitles: z.array(z.string()).optional(),
	labels: z.array(z.string()).optional(),
	labelTitles: z.array(z.string()).optional(),

	linked: z.boolean().optional(),
	reconciled: z.boolean().optional(),
	dataChecked: z.boolean().optional(),
	complete: z.boolean().optional()
});

export type UpdateJournalSchemaSuperType = typeof updateJournalSchema;
export type UpdateJournalSchemaType = z.infer<typeof updateJournalSchema>;
export type UpdateJournalSchemaInputType = z.input<typeof updateJournalSchema>;

export const journalOrderByEnum = [
	'date',
	'description',
	'amount',
	'linked',
	'reconciled',
	'dataChecked',
	'complete',
	'accountName'
] as const;

export const journalFilterSchema = z.object({
	id: z.string().optional(),
	idArray: z.array(z.string()).optional(),
	transactionIdArray: z.array(z.string()).optional(),
	dateBefore: dateStringSchema.optional(),
	dateAfter: dateStringSchema.optional(),
	yearMonth: z.array(z.string()).optional(),
	description: z.string().optional(),
	linked: z.coerce.boolean().optional(),
	reconciled: z.coerce.boolean().optional(),
	dataChecked: z.coerce.boolean().optional(),
	complete: z.coerce.boolean().optional(),
	account: accountFilterSchema
		.omit({ page: true, pageSize: true, orderBy: true })
		.optional()
		.default({ type: ['asset', 'liability'] })
		.optional(),
	tag: tagFilterSchema.omit({ page: true, pageSize: true, orderBy: true }).optional(),
	bill: billFilterSchema.omit({ page: true, pageSize: true, orderBy: true }).optional(),
	budget: budgetFilterSchema.omit({ page: true, pageSize: true, orderBy: true }).optional(),
	category: categoryFilterSchema.omit({ page: true, pageSize: true, orderBy: true }).optional(),
	label: labelFilterSchema.omit({ page: true, pageSize: true, orderBy: true }).optional(),
	page: z.coerce.number().optional().default(0),
	pageSize: z.coerce.number().optional().default(10),
	orderBy: z
		.array(z.object({ field: z.enum(journalOrderByEnum), direction: z.enum(['asc', 'desc']) }))
		.optional()
		.default([
			{ direction: 'desc', field: 'date' },
			{ direction: 'desc', field: 'amount' }
		])
});

export type JournalFilterSchemaInputType = z.input<typeof journalFilterSchema>;

export type JournalFilterSchemaType = z.infer<typeof journalFilterSchema>;

export const defaultAllJournalFilter: JournalFilterSchemaType = {
	account: { type: ['asset', 'liability', 'expense', 'income'] },
	page: 0,
	pageSize: 100000000,
	orderBy: [{ field: 'date', direction: 'desc' }]
};

export const defaultJournalFilter: JournalFilterSchemaType = {
	account: { type: ['asset', 'liability'] },
	page: 0,
	pageSize: 10,
	orderBy: [{ field: 'date', direction: 'desc' }]
};

type OrderByEnumType = (typeof journalOrderByEnum)[number];

type OrderByEnumTitles = {
	[K in OrderByEnumType]: string;
};

const enumTitles: OrderByEnumTitles = {
	date: 'Date',
	description: 'Description',
	amount: 'Amount',
	linked: 'Linked',
	reconciled: 'Reconciled',
	dataChecked: 'Data Checked',
	complete: 'Complete',
	accountName: 'Account Title'
};

export const journalOrderByEnumToText = (input: OrderByEnumType) => {
	return enumTitles[input];
};
