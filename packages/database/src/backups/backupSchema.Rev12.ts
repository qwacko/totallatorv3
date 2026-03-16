import * as z from 'zod';

import { backupSchemaRev11 } from './backupSchema.Rev11';

export const backupSchemaRev12 = backupSchemaRev11.extend({
	version: z.literal(12)
});

export type BackupSchemaRev12Type = z.infer<typeof backupSchemaRev12>;
