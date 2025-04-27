import { z } from 'zod';
import {
	createFileNoteRelationshipSchema,
	fileNoteRelationshipFilterSchema
} from './helpers/fileNoteRelationship';
import { fileReasonEnum } from './enum/fileReasonEnum';
import { fileTypeEnum } from './enum/fileTypeEnum';
import { fileOrderByEnum } from './enum/fileOrderByEnum';

export const createFileSchema = z.object({
	title: z.string().optional(),
	reason: z.enum(fileReasonEnum),
	file: z
		.instanceof(File, { message: 'Please upload a file.' })
		.refine((f) => f.size < 10_000_000, 'Max 10 MB upload size.'),
	...createFileNoteRelationshipSchema
});

export type CreateFileSchemaType = z.infer<typeof createFileSchema>;

export const updateFileSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	reason: z.enum(fileReasonEnum).optional(),
	...createFileNoteRelationshipSchema
});

export type UpdateFileSchemaType = z.infer<typeof updateFileSchema>;

export const fileFilterWithoutPaginationSchema = z.object({
	textFilter: z.string().optional(),
	idArray: z.array(z.string()).optional(),
	excludeIdArray: z.array(z.string()).optional(),
	titleArray: z.array(z.string()).optional(),
	excludeTitleArray: z.array(z.string()).optional(),
	reasonArray: z.array(z.enum(fileReasonEnum)).optional(),
	excludeReasonArray: z.array(z.enum(fileReasonEnum)).optional(),
	typeArray: z.array(z.enum(fileTypeEnum)).optional(),
	excludeTypeArray: z.array(z.enum(fileTypeEnum)).optional(),
	filenameArray: z.array(z.string()).optional(),
	excludeFilenameArray: z.array(z.string()).optional(),
	thumbnail: z.boolean().optional(),
	maxSize: z.number().optional(),
	minSize: z.number().optional(),
	linked: z.boolean().optional(),
	exists: z.boolean().optional(),
	...fileNoteRelationshipFilterSchema
});

export type FileFilterSchemaWithoutPaginationType = z.infer<
	typeof fileFilterWithoutPaginationSchema
>;

export const fileFilterSchema = fileFilterWithoutPaginationSchema.merge(
	z.object({
		page: z.number().default(0).optional(),
		pageSize: z.number().default(10).optional(),
		orderBy: z
			.array(z.object({ field: z.enum(fileOrderByEnum), direction: z.enum(['asc', 'desc']) }))
			.default([{ direction: 'desc', field: 'createdAt' }])
			.optional()
	})
);
export type FileFilterSchemaType = z.infer<typeof fileFilterSchema>;
