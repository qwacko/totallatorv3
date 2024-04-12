import { logging } from '../logging';
import type { BackupSchemaRev01Type } from './backupSchema.Rev01';
import type { BackupSchemaRev02Type } from './backupSchema.Rev02';

export const backupSchemaMigrate_01to02Information = (
	backup01Information: Pick<BackupSchemaRev01Type, 'information' | 'version'>
): Pick<BackupSchemaRev02Type, 'information' | 'version'> => {
	return {
		version: 2,
		information: backup01Information.information
	};
};

export const backupSchemaMigrate_01to02 = (
	backup01: BackupSchemaRev01Type
): BackupSchemaRev02Type => {
	logging.info('Transforming Backup From Rev 01 to Rev 02');
	return {
		...backupSchemaMigrate_01to02Information({
			version: backup01.version,
			information: backup01.information
		}),
		data: {
			user: backup01.data.user,
			session: backup01.data.session.map((session) => ({
				...session,
				activeExpires: Number(session.activeExpires),
				idleExpires: Number(session.idleExpires)
			})),
			key: backup01.data.key,
			account: backup01.data.account,
			bill: backup01.data.bill,
			budget: backup01.data.budget,
			category: backup01.data.category,
			transaction: backup01.data.transaction,
			journalEntry: backup01.data.journalEntry,
			label: backup01.data.label,
			labelsToJournals: backup01.data.labelsToJournals,
			tag: backup01.data.tag,
			importItemDetail: backup01.data.importItemDetail,
			importTable: backup01.data.importTable,
			importMapping: backup01.data.importMapping,
			reusableFilter: backup01.data.reusableFilter
		}
	};
};
