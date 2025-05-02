import { z } from 'zod';
import { fileFilterCoreSchema } from './fileSchema';
import { noteFilterCoreSchema } from './noteSchema';
import { associatedInfoOrderByEnum } from './enum/associatedInfoOrderByEnum';
import { createFileNoteRelationshipSchema } from './helpers/fileNoteRelationship';
import { fileReasonEnum } from './enum/fileReasonEnum';
import { noteTypeEnum } from './enum/noteTypeEnum';

export const assocatiedInfoFilterSchema = z.object({
	textFilter: z.string().optional(),
	idArray: z.array(z.string()).optional(),
	excludeIdArray: z.array(z.string()).optional(),
	titleArray: z.array(z.string()).optional(),
	excludeTitleArray: z.array(z.string()).optional(),
	createdByIdArray: z.array(z.string()).optional(),
	excludeCreatedByIdArray: z.array(z.string()).optional(),
	linked: z.boolean().optional(),
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
	excludeReportElementIdArray: z.array(z.string()).optional(),
	file: fileFilterCoreSchema.optional(),
	note: noteFilterCoreSchema.optional()
});

export type AssociatedInfoFilterSchemaType = z.infer<typeof assocatiedInfoFilterSchema>;

export const associatedInfoFilterSchemaWithPagination = assocatiedInfoFilterSchema.merge(
	z.object({
		page: z.number().optional(),
		pageSize: z.number().optional(),
		orderBy: z
			.array(
				z.object({ field: z.enum(associatedInfoOrderByEnum), direction: z.enum(['asc', 'desc']) })
			)
			.default([{ direction: 'desc', field: 'createdAt' }])
			.optional()
	})
);

export type AssociatedInfoFilterSchemaWithPaginationType = z.infer<
	typeof associatedInfoFilterSchemaWithPagination
>;

export const createAssociatedInfoSchema = z
	.object({
		title: z.string().optional(),
		fileTitle: z.string().optional(),
		fileReason: z.enum(fileReasonEnum).optional(),
		file: z
			.instanceof(File, { message: 'Please upload a file.' })
			.refine((f) => f.size < 10_000_000, 'Max 10 MB upload size.'),
		note: z.string().optional(),
		noteType: z.enum(noteTypeEnum).optional(),
		createSummary: z.boolean().optional(),
		...createFileNoteRelationshipSchema
	})
	.refine((data) => !data.file || (data.file && data.fileTitle), {
		message: 'File title is required when file is provided',
		path: ['fileTitle']
	})
	.refine((data) => !data.file || (data.file && data.fileReason), {
		message: 'File reason is required when file is provided',
		path: ['fileReason']
	})
	.refine((data) => !data.note || (data.note && data.noteType), {
		message: 'Note type is required when note is provided',
		path: ['noteType']
	})
	.refine((data) => data.createSummary || data.note || data.file, {
		message: 'Some associated information is required (journal summary creation, note or File)'
	})
	.refine(
		(data) =>
			!((data.transactionId || data.reportId || data.reportElementId) && data.createSummary),
		{
			message:
				'Summary creation is not allowed when transaction, report or report element is provided',
			path: ['createSummary']
		}
	);

export type CreateAssociatedInfoSchemaType = z.infer<typeof createAssociatedInfoSchema>;
export type CreateAssociatedInfoSchemaInputType = z.input<typeof createAssociatedInfoSchema>;
