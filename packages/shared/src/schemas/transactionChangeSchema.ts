import * as z from 'zod';

export const transactionChangeTypeEnum = ['create', 'update', 'delete'] as const;
export type TransactionChangeType = (typeof transactionChangeTypeEnum)[number];

export const transactionChangeSourceTypeEnum = ['user', 'import', 'system', 'filter'] as const;
export type TransactionChangeSourceType = (typeof transactionChangeSourceTypeEnum)[number];

export const historyLinkedItemSnapshotSchema = z.object({
	id: z.string().nullable(),
	title: z.string().nullable()
});

export type HistoryLinkedItemSnapshotType = z.infer<typeof historyLinkedItemSnapshotSchema>;

export const historyLabelSnapshotSchema = historyLinkedItemSnapshotSchema;
export type HistoryLabelSnapshotType = z.infer<typeof historyLabelSnapshotSchema>;

export const historyJournalSnapshotSchema = z.object({
	id: z.string(),
	importId: z.string().nullable(),
	importDetailId: z.string().nullable(),
	amount: z.number(),
	description: z.string(),
	dateText: z.string(),
	linked: z.boolean(),
	reconciled: z.boolean(),
	dataChecked: z.boolean(),
	complete: z.boolean(),
	transfer: z.boolean(),
	account: historyLinkedItemSnapshotSchema,
	bill: historyLinkedItemSnapshotSchema,
	budget: historyLinkedItemSnapshotSchema,
	category: historyLinkedItemSnapshotSchema,
	tag: historyLinkedItemSnapshotSchema,
	labels: z.array(historyLabelSnapshotSchema)
});

export type HistoryJournalSnapshotType = z.infer<typeof historyJournalSnapshotSchema>;

export const transactionHistorySnapshotSchema = z.object({
	transactionId: z.string(),
	journals: z.array(historyJournalSnapshotSchema)
});

export type TransactionHistorySnapshotType = z.infer<typeof transactionHistorySnapshotSchema>;

export const transactionChangeActorSchema = z.object({
	userId: z.string().nullable(),
	userName: z.string().nullable()
});

export type TransactionChangeActorType = z.infer<typeof transactionChangeActorSchema>;

export const transactionChangeSourceSchema = z.object({
	sourceType: z.enum(transactionChangeSourceTypeEnum),
	importId: z.string().nullable().optional(),
	importTitle: z.string().nullable().optional(),
	importDetailId: z.string().nullable().optional(),
	filterId: z.string().nullable().optional(),
	filterTitle: z.string().nullable().optional()
});

export type TransactionChangeSourceTypeSchema = z.infer<typeof transactionChangeSourceSchema>;

export const transactionChangeRecordSchema = z.object({
	id: z.string(),
	transactionId: z.string(),
	changeType: z.enum(transactionChangeTypeEnum),
	sourceType: z.enum(transactionChangeSourceTypeEnum),
	actorUserId: z.string().nullable(),
	actorUserName: z.string().nullable(),
	sourceImportId: z.string().nullable(),
	sourceImportTitle: z.string().nullable(),
	sourceImportDetailId: z.string().nullable(),
	sourceFilterId: z.string().nullable(),
	sourceFilterTitle: z.string().nullable(),
	summary: z.string().nullable(),
	changedFields: z.array(z.string()).nullable(),
	beforeSnapshot: transactionHistorySnapshotSchema.nullable(),
	afterSnapshot: transactionHistorySnapshotSchema.nullable(),
	createdAt: z.date(),
	updatedAt: z.date()
});

export type TransactionChangeRecordType = z.infer<typeof transactionChangeRecordSchema>;

export const transactionHistoryQuerySchema = z.object({
	transactionId: z.string()
});

export type TransactionHistoryQuerySchemaType = z.infer<typeof transactionHistoryQuerySchema>;

export const importTransactionHistoryQuerySchema = z.object({
	importId: z.string()
});

export type ImportTransactionHistoryQuerySchemaType = z.infer<
	typeof importTransactionHistoryQuerySchema
>;
