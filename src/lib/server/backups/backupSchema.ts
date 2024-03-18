import { z } from 'zod';
import { backupSchemaRev01 } from './backupSchema.Rev01';
import { backupSchemaRev02 } from './backupSchema.Rev02';
import { backupSchemaRev03 } from './backupSchema.Rev03';
import { backupSchemaRev04 } from './backupSchema.Rev04';
import { backupSchemaRev05 } from './backupSchema.Rev05';
import {
	backupSchemaMigrate_01to02,
	backupSchemaMigrate_01to02Information
} from './backupSchemaMigrate_01to02';
import {
	backupSchemaMigrate_02to03,
	backupSchemaMigrate_02to03Information
} from './backupSchemaMigrate_02to03';
import {
	backupSchemaMigrate_04to05,
	backupSchemaMigrate_04to05Information
} from './backupSchemaMigrate_04to05';
import {
	backupSchemaMigrate_03to04,
	backupSchemaMigrate_03to04Information
} from './backupSchemaMigrate_03to04';

export const currentBackupSchema = backupSchemaRev05;
export type CurrentBackupSchemaType = z.infer<typeof currentBackupSchema>;
export type CurrentBackupSchemaInfoType = Pick<CurrentBackupSchemaType, 'information' | 'version'>;

export const combinedBackupSchema = z.union([
	backupSchemaRev01,
	backupSchemaRev02,
	backupSchemaRev03,
	backupSchemaRev04,
	backupSchemaRev05
]);

export const combinedBackupInfoSchema = z.union([
	backupSchemaRev01.pick({ information: true, version: true }),
	backupSchemaRev02.pick({ information: true, version: true }),
	backupSchemaRev03.pick({ information: true, version: true }),
	backupSchemaRev04.pick({ information: true, version: true }),
	backupSchemaRev05.pick({ information: true, version: true })
]);

export type CombinedBackupSchemaType = z.infer<typeof combinedBackupSchema>;
export type CombinedBackupSchemaInfoType = z.infer<typeof combinedBackupInfoSchema>;

export const backupSchemaInfoToLatest = (
	backupDataParsed: CombinedBackupSchemaInfoType
): CurrentBackupSchemaInfoType => {
	const backupDataParsed02 =
		backupDataParsed.version !== 1
			? backupDataParsed
			: backupSchemaMigrate_01to02Information(backupDataParsed);

	const backupDataParsed03 =
		backupDataParsed02.version !== 2
			? backupDataParsed02
			: backupSchemaMigrate_02to03Information(backupDataParsed02);

	const backupDataParsed04 =
		backupDataParsed03.version !== 3
			? backupDataParsed03
			: backupSchemaMigrate_03to04Information(backupDataParsed03);

	const backupDataParsed05 =
		backupDataParsed04.version !== 4
			? backupDataParsed04
			: backupSchemaMigrate_04to05Information(backupDataParsed04);

	return backupDataParsed05;
};

export const backupSchemaToLatest = (
	backupDataParsed: CombinedBackupSchemaType
): CurrentBackupSchemaType => {
	const backupDataParsed02 =
		backupDataParsed.version !== 1
			? backupDataParsed
			: backupSchemaMigrate_01to02(backupDataParsed);

	const backupDataParsed03 =
		backupDataParsed02.version !== 2
			? backupDataParsed02
			: backupSchemaMigrate_02to03(backupDataParsed02);

	const backupDataParsed04 =
		backupDataParsed03.version !== 3
			? backupDataParsed03
			: backupSchemaMigrate_03to04(backupDataParsed03);

	const backupDataParsed05 =
		backupDataParsed04.version !== 4
			? backupDataParsed04
			: backupSchemaMigrate_04to05(backupDataParsed04);

	return backupDataParsed05;
};
