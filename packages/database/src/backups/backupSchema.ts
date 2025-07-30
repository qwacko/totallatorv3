import * as z from 'zod';
import { backupSchemaRev01 } from './backupSchema.Rev01';
import { backupSchemaRev02 } from './backupSchema.Rev02';
import { backupSchemaRev03 } from './backupSchema.Rev03';
import { backupSchemaRev04 } from './backupSchema.Rev04';
import { backupSchemaRev05 } from './backupSchema.Rev05';
import { backupSchemaRev06 } from './backupSchema.Rev06';
import { backupSchemaRev07 } from './backupSchema.Rev07';
import { backupSchemaRev08 } from './backupSchema.Rev08';
import { backupSchemaRev09 } from './backupSchema.Rev09';
import { backupSchemaRev10 } from './backupSchema.Rev10';
import { backupSchemaRev11 } from './backupSchema.Rev11';
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
import {
	backupSchemaMigrate_07to08,
	backupSchemaMigrate_07to08Information
} from './backupSchemaMigrate_07to08';
import {
	backupSchemaMigrate_08to09,
	backupSchemaMigrate_08to09Information
} from './backupSchemaMigrate_08to09';
import {
	backupSchemaMigrate_09to10,
	backupSchemaMigrate_09to10Information
} from './backupSchemaMigrate_09to10';
import {
	backupSchemaMigrate_10to11,
	backupSchemaMigrate_10to11Information
} from './backupSchemaMigrate_10to11';

export const currentBackupSchema = backupSchemaRev11;
export type CurrentBackupSchemaType = z.infer<typeof currentBackupSchema>;
export type CurrentBackupSchemaInfoType = Pick<CurrentBackupSchemaType, 'information' | 'version'>;

// export type CombinedBackupSchemaType = z.infer<typeof combinedBackupSchema>;
export type CombinedBackupSchemaType = z.infer<typeof combinedBackupSchema>;
export type CombinedBackupSchemaInfoType = z.infer<typeof combinedBackupInfoSchema>;

// type CombinedBackupSchemaZodType = ZodUnion<[typeof backupSchemaRev01, typeof backupSchemaRev02, typeof backupSchemaRev03, typeof backupSchemaRev04, typeof backupSchemaRev05, typeof backupSchemaRev06, typeof backupSchemaRev07, typeof backupSchemaRev08, typeof backupSchemaRev09, typeof backupSchemaRev10, typeof backupSchemaRev11]>;

export const combinedBackupSchema = z.union([
	backupSchemaRev01,
	backupSchemaRev02,
	backupSchemaRev03,
	backupSchemaRev04,
	backupSchemaRev05,
	backupSchemaRev06,
	backupSchemaRev07,
	backupSchemaRev08,
	backupSchemaRev09,
	backupSchemaRev10,
	backupSchemaRev11
]);

export const combinedBackupInfoSchema = z.union([
	backupSchemaRev01.pick({ information: true, version: true }),
	backupSchemaRev02.pick({ information: true, version: true }),
	backupSchemaRev03.pick({ information: true, version: true }),
	backupSchemaRev04.pick({ information: true, version: true }),
	backupSchemaRev05.pick({ information: true, version: true }),
	backupSchemaRev06.pick({ information: true, version: true }),
	backupSchemaRev07.pick({ information: true, version: true }),
	backupSchemaRev08.pick({ information: true, version: true }),
	backupSchemaRev09.pick({ information: true, version: true }),
	backupSchemaRev10.pick({ information: true, version: true }),
	backupSchemaRev11.pick({ information: true, version: true })
]);

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

	const backupDataParsed09 =
		backupDataParsed08.version !== 8
			? backupDataParsed08
			: backupSchemaMigrate_08to09Information(backupDataParsed08);

	const backupDataParsed10 =
		backupDataParsed09.version !== 9
			? backupDataParsed09
			: backupSchemaMigrate_09to10Information(backupDataParsed09);

	const backupDataParsed11 =
		backupDataParsed10.version !== 10
			? backupDataParsed10
			: backupSchemaMigrate_10to11Information(backupDataParsed10);

	return backupDataParsed11;
};

export const backupSchemaToLatest = (
	backupDataParsed: CombinedBackupSchemaType,
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

	const backupDataParsed09 =
		backupDataParsed08.version !== 8
			? backupDataParsed08
			: backupSchemaMigrate_08to09(backupDataParsed08);

	const backupDataParsed10 =
		backupDataParsed09.version !== 9
			? backupDataParsed09
			: backupSchemaMigrate_09to10(backupDataParsed09);

	const backupDataParsed11 =
		backupDataParsed10.version !== 10
			? backupDataParsed10
			: backupSchemaMigrate_10to11(backupDataParsed10);

	return backupDataParsed11;
};
