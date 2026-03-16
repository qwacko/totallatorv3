import type { BackupSchemaRev12Type } from './backupSchema.Rev12';
import type { BackupSchemaRev13Type } from './backupSchema.Rev13';

export const backupSchemaMigrate_12to13Information = (
	backup12Information: Pick<BackupSchemaRev12Type, 'information' | 'version'>
): Pick<BackupSchemaRev13Type, 'information' | 'version'> => {
	return {
		version: 13,
		information: {
			...backup12Information.information,
			itemCount: {
				...backup12Information.information.itemCount,
				numberTransactionChanges: 0
			}
		}
	};
};

export const backupSchemaMigrate_12to13 = (backup12: BackupSchemaRev12Type): BackupSchemaRev13Type => {
	return {
		...backupSchemaMigrate_12to13Information({
			version: backup12.version,
			information: backup12.information
		}),
		data: {
			...backup12.data,
			transactionChange: []
		}
	};
};
