import type { BackupSchemaRev11Type } from './backupSchema.Rev11';
import type { BackupSchemaRev12Type } from './backupSchema.Rev12';

export const backupSchemaMigrate_11to12Information = (
	backup11Information: Pick<BackupSchemaRev11Type, 'information' | 'version'>
): Pick<BackupSchemaRev12Type, 'information' | 'version'> => {
	return {
		version: 12,
		information: backup11Information.information
	};
};

export const backupSchemaMigrate_11to12 = (
	backup11: BackupSchemaRev11Type
): BackupSchemaRev12Type => {
	return {
		...backupSchemaMigrate_11to12Information({
			version: backup11.version,
			information: backup11.information
		}),
		data: backup11.data
	};
};
