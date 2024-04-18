import { z } from 'zod';
import { noteTypeEnum } from './enum/noteTypeEnum';
import { noteOrderByEnum } from './enum/noteOrderByEnum';
import {
	createFileNoteRelationshipSchema,
	fileNoteRelationshipFilterSchema
} from './helpers/fileNoteRelationship';

export const createNoteSchema = z.object({
	note: z.string(),
	type: z.enum(noteTypeEnum),
	...createFileNoteRelationshipSchema
});

export type CreateNoteSchemaType = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = z.object({
	id: z.string(),
	note: z.string().optional(),
	type: z.enum(noteTypeEnum).optional()
});

export type UpdateNoteSchemaType = z.infer<typeof updateNoteSchema>;

export const noteFilterWithoutPaginationSchema = z.object({
	textFilter: z.string().optional(),
	idArray: z.array(z.string()).optional(),
	excludeIdArray: z.array(z.string()).optional(),
	noteArray: z.array(z.string()).optional(),
	excludeNoteArray: z.array(z.string()).optional(),
	typeArray: z.array(z.enum(noteTypeEnum)).optional(),
	excludeTypeArray: z.array(z.enum(noteTypeEnum)).optional(),
	...fileNoteRelationshipFilterSchema
});

export type NoteFilterSchemaWithoutPaginationType = z.infer<
	typeof noteFilterWithoutPaginationSchema
>;

export const noteFilterSchema = noteFilterWithoutPaginationSchema.merge(
	z.object({
		page: z.number().default(0).optional(),
		pageSize: z.number().default(10).optional(),
		orderBy: z
			.array(z.object({ field: z.enum(noteOrderByEnum), direction: z.enum(['asc', 'desc']) }))
			.default([{ direction: 'desc', field: 'createdAt' }])
			.optional()
	})
);
export type NoteFilterSchemaType = z.infer<typeof noteFilterSchema>;

export const linkedNoteFilterSchema = z.object({
	note: z.boolean().optional(),
	reminder: z.boolean().optional()
});

export type LinkedNoteFilterSchemaType = z.infer<typeof linkedNoteFilterSchema>;
