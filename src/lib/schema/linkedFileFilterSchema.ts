import { z } from 'zod';

export const linkedFileFilterSchema = z.object({
	file: z.boolean().optional()
});

export type LinkedFileFilterSchemaType = z.infer<typeof linkedFileFilterSchema>;
