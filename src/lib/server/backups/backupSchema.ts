import { z } from 'zod';
import { backupSchemaRev01 } from './backupSchema.Rev01';
import { backupSchemaRev02 } from './backupSchema.Rev02';
import { backupSchemaRev03 } from './backupSchema.Rev03';
import { backupSchemaRev04 } from './backupSchema.Rev04';
import { backupSchemaRev05 } from './backupSchema.Rev05';
import { backupSchemaRev06 } from './backupSchema.Rev06';
import { backupSchemaRev07 } from './backupSchema.Rev07';
import {
	backupSchemaMigrate_01to02,
	backupSchemaMigrate_01to02Information
} from './backupSchemaMigrate_01to02';
import {
	backupSchemaMigrate_02to03,
	backupSchemaMigrate_02to03Information
} from './backupSchemaMigrate_02to03';
import {
	backupSchemaMigrate_03to04,
	backupSchemaMigrate_03to04Information
} from './backupSchemaMigrate_03to04';
import {
	backupSchemaMigrate_04to05,
	backupSchemaMigrate_04to05Information
} from './backupSchemaMigrate_04to05';
import {
	backupSchemaMigrate_05to06,
	backupSchemaMigrate_05to06Information
} from './backupSchemaMigrate_05to06';
import {
	backupSchemaMigrate_06to07,
	backupSchemaMigrate_06to07Information
} from './backupSchemaMigrate_06to07';
import { backupSchemaRev08 } from './backupSchema.Rev08';
import {
	backupSchemaMigrate_07to08,
	backupSchemaMigrate_07to08Information
} from './backupSchemaMigrate_07to08';

export const currentBackupSchema = backupSchemaRev08;
export type CurrentBackupSchemaType = z.infer<typeof currentBackupSchema>;
export type CurrentBackupSchemaInfoType = Pick<CurrentBackupSchemaType, 'information' | 'version'>;

export const combinedBackupSchema = z.union([
	backupSchemaRev01,
	backupSchemaRev02,
	backupSchemaRev03,
	backupSchemaRev04,
	backupSchemaRev05,
	backupSchemaRev06,
	backupSchemaRev07,
	backupSchemaRev08
]);

export const combinedBackupInfoSchema = z.union([
	backupSchemaRev01.pick({ information: true, version: true }),
	backupSchemaRev02.pick({ information: true, version: true }),
	backupSchemaRev03.pick({ information: true, version: true }),
	backupSchemaRev04.pick({ information: true, version: true }),
	backupSchemaRev05.pick({ information: true, version: true }),
	backupSchemaRev06.pick({ information: true, version: true }),
	backupSchemaRev07.pick({ information: true, version: true }),
	backupSchemaRev08.pick({ information: true, version: true })
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

	const backupDataParsed06 =
		backupDataParsed05.version !== 5
			? backupDataParsed05
			: backupSchemaMigrate_05to06Information(backupDataParsed05);

	const backupDataParsed07 =
		backupDataParsed06.version !== 6
			? backupDataParsed06
			: backupSchemaMigrate_06to07Information(backupDataParsed06);

	const backupDataParsed08 =
		backupDataParsed07.version !== 7
			? backupDataParsed07
			: backupSchemaMigrate_07to08Information(backupDataParsed07);

	return backupDataParsed08;
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

	const backupDataParsed06 =
		backupDataParsed05.version !== 5
			? backupDataParsed05
			: backupSchemaMigrate_05to06(backupDataParsed05);

	const backupDataParsed07 =
		backupDataParsed06.version !== 6
			? backupDataParsed06
			: backupSchemaMigrate_06to07(backupDataParsed06);

	const backupDataParsed08 =
		backupDataParsed07.version !== 7
			? backupDataParsed07
			: backupSchemaMigrate_07to08(backupDataParsed07);

	return backupDataParsed08;
};
