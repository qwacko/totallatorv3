import { z } from 'zod';

export const createFileNoteRelationshipSchema = {
	transactionId: z.string().optional().nullable(),
	accountId: z.string().optional().nullable(),
	billId: z.string().optional().nullable(),
	budgetId: z.string().optional().nullable(),
	categoryId: z.string().optional().nullable(),
	tagId: z.string().optional().nullable(),
	labelId: z.string().optional().nullable(),
	autoImportId: z.string().optional().nullable(),
	reportId: z.string().optional().nullable(),
	reportElementId: z.string().optional().nullable()
};

export const fileRelationshipKeys = Object.keys(createFileNoteRelationshipSchema);

const createFileNoteRelationshipSchemaCombined = z.object(createFileNoteRelationshipSchema);

export type CreateFileNoteRelationshipSchemaType = z.infer<
	typeof createFileNoteRelationshipSchemaCombined
>;

export type KeysOfCreateFileNoteRelationshipSchemaType = keyof CreateFileNoteRelationshipSchemaType;

export const fileNoteRelationshipFilterSchema = {
	transactionIdArray: z.array(z.string()).optional(),
	excludeTransactionIdArray: z.array(z.string()).optional(),
	accountIdArray: z.array(z.string()).optional(),
	excludeAccountIdArray: z.array(z.string()).optional(),
	billIdArray: z.array(z.string()).optional(),
	excludeBillIdArray: z.array(z.string()).optional(),
	budgetIdArray: z.array(z.string()).optional(),
	excludeBudgetIdArray: z.array(z.string()).optional(),
	categoryIdArray: z.array(z.string()).optional(),
	excludeCategoryIdArray: z.array(z.string()).optional(),
	tagIdArray: z.array(z.string()).optional(),
	excludeTagIdArray: z.array(z.string()).optional(),
	labelIdArray: z.array(z.string()).optional(),
	excludeLabelIdArray: z.array(z.string()).optional(),
	autoImportIdArray: z.array(z.string()).optional(),
	excludeAutoImportIdArray: z.array(z.string()).optional(),
	reportIdArray: z.array(z.string()).optional(),
	excludeReportIdArray: z.array(z.string()).optional(),
	reportElementIdArray: z.array(z.string()).optional(),
	excludeReportElementIdArray: z.array(z.string()).optional()
};
