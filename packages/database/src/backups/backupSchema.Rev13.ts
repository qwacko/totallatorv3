import * as z from 'zod';

import { transactionChangeRecordSchema } from '@totallator/shared';

import { backupSchemaRev12 } from './backupSchema.Rev12';

export const backupSchemaRev13 = backupSchemaRev12.extend({
	version: z.literal(13),
	information: backupSchemaRev12.shape.information.extend({
		itemCount: backupSchemaRev12.shape.information.shape.itemCount.extend({
			numberTransactionChanges: z.number()
		})
	}),
	data: backupSchemaRev12.shape.data.extend({
		transactionChange: z.array(transactionChangeRecordSchema)
	})
});

export type BackupSchemaRev13Type = z.infer<typeof backupSchemaRev13>;
