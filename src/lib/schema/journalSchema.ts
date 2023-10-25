import { z } from 'zod';
import { dateStringSchema } from './dateStringSchema';
import { accountFilterSchema } from './accountSchema';
import { tagFilterSchema } from './tagSchema';
import { billFilterSchema } from './billSchema';
import { budgetFilterSchema } from './budgetSchema';
import { categoryFilterSchema } from './categorySchema';
import { labelFilterSchema } from './labelSchema';
import { cloneDeep } from 'lodash-es';

const zodStringBlanking = z
	.string()
	.optional()
	.nullable()
	.transform((val) =>
		val === '' || val === 'undefined' || val === 'null' ? undefined : val ? val : undefined
	);

const zodCoercedBoolean = z.boolean().or(
	z
		.string()
		.refine(
			(val) =>
				val === '0' || val === '1' || val.toLowerCase() === 'true' || val.toLowerCase() === 'false'
		)
		.transform((val) => val === '1' || val.toLowerCase() === 'true')
);

export const createJournalDBCore = z.object({
	date: dateStringSchema,
	description: z.string(),
	amount: z.coerce.number(),
	tagId: zodStringBlanking,
	billId: zodStringBlanking,
	budgetId: zodStringBlanking,
	categoryId: zodStringBlanking,
	accountId: zodStringBlanking,
	importId: zodStringBlanking,
	importDetailId: zodStringBlanking,
	labels: z.array(z.string()).optional(),
	linked: zodCoercedBoolean.default(true).optional(),
	reconciled: zodCoercedBoolean.default(false).optional(),
	dataChecked: zodCoercedBoolean.default(false).optional(),
	complete: zodCoercedBoolean.default(false).optional()
});

export type CreateJournalDBCoreType = z.infer<typeof createJournalDBCore>;

export const createJournalSchemaCore = createJournalDBCore.merge(
	z.object({
		tagTitle: zodStringBlanking,
		billTitle: zodStringBlanking,
		budgetTitle: zodStringBlanking,
		categoryTitle: zodStringBlanking,
		accountTitle: zodStringBlanking,
		labelTitles: z.array(z.string()).optional()
	})
);

export const createJournalSchema = createJournalSchemaCore
	.refine((data) => !(data.tagId && data.tagTitle), {
		path: ['tagId'],
		message: 'tagId and tagTitle cannot both be present'
	})
	.refine((data) => !(data.billId && data.billTitle), {
		path: ['billId'],
		message: 'billId and billTitle cannot both be present'
	})
	.refine((data) => !(data.budgetId && data.budgetTitle), {
		path: ['budgetId'],
		message: 'budgetId and budgetTitle cannot both be present'
	})
	.refine((data) => !(data.categoryId && data.categoryTitle), {
		path: ['categoryId'],
		message: 'categoryId and categoryTitle cannot both be present'
	})
	.refine((data) => data.accountId || data.accountTitle, {
		path: ['accountId'],
		message: 'Account ID or Account Title is required'
	})
	.refine((data) => !(data.accountId && data.accountTitle), {
		path: ['accountId'],
		message: 'Only one of either Account ID or Account Title is allowed. Both are present.'
	});

export const createSimpleTransactionSchemaCore = createJournalSchemaCore
	.omit({ accountId: true, accountTitle: true })
	.extend({
		fromAccountId: zodStringBlanking,
		fromAccountTitle: zodStringBlanking,
		toAccountId: zodStringBlanking,
		toAccountTitle: zodStringBlanking
	});

export type CreateSimpleTransactionSuperType = typeof createSimpleTransactionSchemaCore;

export const createSimpleTransactionSchema = createSimpleTransactionSchemaCore
	.refine((data) => !(data.tagId && data.tagTitle), {
		path: ['tagId'],
		message: 'tagId and tagTitle cannot both be present'
	})
	.refine((data) => !(data.billId && data.billTitle), {
		path: ['billId'],
		message: 'billId and billTitle cannot both be present'
	})
	.refine((data) => !(data.budgetId && data.budgetTitle), {
		path: ['budgetId'],
		message: 'budgetId and budgetTitle cannot both be present'
	})
	.refine((data) => !(data.categoryId && data.categoryTitle), {
		path: ['categoryId'],
		message: 'categoryId and categoryTitle cannot both be present'
	})
	.refine((data) => data.fromAccountId || data.fromAccountTitle, {
		path: ['fromAccountId'],
		message: 'From Account ID or Account Title is required'
	})
	.refine((data) => !(data.fromAccountId && data.fromAccountTitle), {
		path: ['fromAccountId'],
		message:
			'Only one of either From Account ID or From Account Title is allowed. Both are present.'
	})
	.refine((data) => data.toAccountId || data.toAccountTitle, {
		path: ['toAccountId'],
		message: 'To Account ID or Account Title is required'
	})
	.refine((data) => !(data.toAccountId && data.toAccountTitle), {
		path: ['toAccountId'],
		message: 'Only one of either To Account ID or To Account Title is allowed. Both are present.'
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
export type CreateSimpleTransactionType = z.infer<typeof createSimpleTransactionSchema>;

export type CreateJournalSchemaSuperType = typeof createJournalSchema;
export type CreateJournalSchemaType = z.infer<typeof createJournalSchema>;

export const updateJournalSchema = z.object({
	previousURL: z.string().optional(),
	date: dateStringSchema.optional(),
	description: z.string().optional(),
	amount: z.number().optional(),
	tagId: zodStringBlanking,
	tagTitle: zodStringBlanking,
	tagClear: z.boolean().optional().default(false),
	billId: zodStringBlanking,
	billTitle: zodStringBlanking,
	billClear: z.boolean().optional().default(false),
	budgetId: zodStringBlanking,
	budgetTitle: zodStringBlanking,
	budgetClear: z.boolean().optional().default(false),
	categoryId: zodStringBlanking,
	categoryTitle: zodStringBlanking,
	categoryClear: z.boolean().optional().default(false),
	accountId: zodStringBlanking,
	accountTitle: zodStringBlanking,
	otherAccountId: zodStringBlanking,
	otherAccountTitle: zodStringBlanking,
	addLabels: z.array(z.string()).optional(),
	addLabelTitles: z.array(z.string()).optional(),
	removeLabels: z.array(z.string()).optional(),
	labels: z.array(z.string()).optional(),
	labelTitles: z.array(z.string()).optional(),
	clearLabels: z.boolean().optional().default(false),

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
	id: z.coerce.string().optional(),
	idArray: z.array(z.string()).optional(),
	transactionIdArray: z.array(z.string()).optional(),
	dateBefore: dateStringSchema.optional(),
	dateAfter: dateStringSchema.optional(),
	yearMonth: z.array(z.string()).optional(),
	description: z.coerce.string().optional(),
	linked: z.coerce.boolean().optional(),
	reconciled: z.coerce.boolean().optional(),
	dataChecked: z.coerce.boolean().optional(),
	complete: z.boolean().optional(),
	importIdArray: z.array(z.string()).optional(),
	importDetailIdArray: z.array(z.string()).optional(),
	payee: z
		.object({
			id: z.string().optional(),
			idArray: z.array(z.string()).optional(),
			title: z.string().optional()
		})
		.optional(),
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

export const defaultAllJournalFilter: () => JournalFilterSchemaType = () =>
	cloneDeep({
		account: { type: ['asset', 'liability', 'expense', 'income'] },
		page: 0,
		pageSize: 100000000,
		orderBy: [{ field: 'date', direction: 'desc' }]
	});

export const defaultJournalFilter: () => JournalFilterSchemaType = () =>
	cloneDeep({
		account: { type: ['asset', 'liability'] },
		page: 0,
		pageSize: 10,
		orderBy: [{ field: 'date', direction: 'desc' }]
	});

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
