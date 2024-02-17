import { z } from 'zod';
import { backupSchemaRev01 } from './backupSchema.Rev01';
import { backupSchemaRev02 } from './backupSchema.Rev02';
import { backupSchemaRev03 } from './backupSchema.Rev03';

export const currentBackupSchema = backupSchemaRev03;
export type CurrentBackupSchemaType = z.infer<typeof currentBackupSchema>;

export const combinedBackupSchema = z.union([
	backupSchemaRev01,
	backupSchemaRev02,
	backupSchemaRev03
]);
export type CombinedBackupSchemaType = z.infer<typeof combinedBackupSchema>;
