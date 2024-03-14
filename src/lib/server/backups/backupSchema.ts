import { z } from 'zod';
import { backupSchemaRev01 } from './backupSchema.Rev01';
import { backupSchemaRev02 } from './backupSchema.Rev02';
import { backupSchemaRev03 } from './backupSchema.Rev03';
import { backupSchemaRev04 } from './backupSchema.Rev04';
import { backupSchemaRev05 } from './backupSchema.Rev05';

export const currentBackupSchema = backupSchemaRev05;
export type CurrentBackupSchemaType = z.infer<typeof currentBackupSchema>;

export const combinedBackupSchema = z.union([
	backupSchemaRev01,
	backupSchemaRev02,
	backupSchemaRev03,
	backupSchemaRev04,
	backupSchemaRev05
]);
export type CombinedBackupSchemaType = z.infer<typeof combinedBackupSchema>;
