import { z } from 'zod';
import { noteTypeEnum } from './enum/noteTypeEnum';
import { noteOrderByEnum } from './enum/noteOrderByEnum';
import {
	createFileNoteRelationshipSchema,
	fileNoteRelationshipFilterSchema
} from './helpers/fileNoteRelationship';
import { journalFilterSchema } from './journalSchema';

export const createNoteJournalSchema = z.object({
	title: z.string(),
	filter: journalFilterSchema,
	includeDate: z.boolean().optional().default(false),
	includeDateRange: z.boolean().optional().default(true),
	includeSum: z.boolean().optional().default(false),
	includeSumPositive: z.boolean().optional().default(false),
	includeSumPositiveNoTransfer: z.boolean().optional().default(false),
	includeSumNegative: z.boolean().optional().default(false),
	includeSumNegativeNoTransfer: z.boolean().optional().default(false),
	includeCount: z.boolean().optional().default(false),
	includeCountPositive: z.boolean().optional().default(false),
	includeCountPositiveNoTransfer: z.boolean().optional().default(false),
	includeCountNegative: z.boolean().optional().default(false),
	includeCountNegativeNoTransfer: z.boolean().optional().default(false),
	includeEarliest: z.boolean().optional().default(false),
	includeLatest: z.boolean().optional().default(false),
	...createFileNoteRelationshipSchema
});

export type CreateNoteJournalSchemaInputType = z.input<typeof createNoteJournalSchema>;
export type CreateNoteJournalSchemaType = z.infer<typeof createNoteJournalSchema>;

export const createNoteSchemaCore = z.object({
	note: z.string(),
	type: z.enum(noteTypeEnum)
});

export type CreateNoteSchemaCoreType = z.infer<typeof createNoteSchemaCore>;

export const createNoteSchema = z
	.object({
		...createFileNoteRelationshipSchema
	})
	.merge(createNoteSchemaCore);

export type CreateNoteSchemaType = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = z.object({
	id: z.string(),
	note: z.string().optional(),
	type: z.enum(noteTypeEnum).optional()
});

export type UpdateNoteSchemaType = z.infer<typeof updateNoteSchema>;

const noteFilterCoreItems = {
	textFilter: z.string().optional(),
	idArray: z.array(z.string()).optional(),
	excludeAssociatedIdArray: z.array(z.string()).optional(),
	noteArray: z.array(z.string()).optional(),
	excludeNoteArray: z.array(z.string()).optional(),
	typeArray: z.array(z.enum(noteTypeEnum)).optional(),
	excludeTypeArray: z.array(z.enum(noteTypeEnum)).optional()
};

export const noteFilterCoreSchema = z.object(noteFilterCoreItems);

export const noteFilterWithoutPaginationSchema = z.object({
	...noteFilterCoreItems,
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
