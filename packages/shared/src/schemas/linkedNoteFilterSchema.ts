import * as z from 'zod';

export const linkedNoteFilterSchema = z.object({
	note: z.boolean().optional(),
	reminder: z.boolean().optional()
});

export type LinkedNoteFilterSchemaType = z.infer<typeof linkedNoteFilterSchema>;
