import { z } from 'zod';

export const idSchema = z.object({ id: z.string() });
export type IdSchemaType = z.infer<typeof idSchema>;
