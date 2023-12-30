import type { z } from 'zod';
import { backupSchemaRev01 } from './backupSchema.Rev01';

export const currentBackupSchema = backupSchemaRev01;
export type CurrentBackupSchemaType = z.infer<typeof currentBackupSchema>;

export const combinedBackupSchema = backupSchemaRev01;
export type CombinedBackupSchemaType = z.infer<typeof combinedBackupSchema>;
