import type { BackupSchemaRev06Type } from './backupSchema.Rev06';
import type { BackupSchemaRev05Type } from './backupSchema.Rev05';
import { logging } from '../logging';

export const backupSchemaMigrate_05to06Information = (
	backup05Information: Pick<BackupSchemaRev05Type, 'information' | 'version'>
): Pick<BackupSchemaRev06Type, 'information' | 'version'> => {
	return {
		version: 6,
		information: {
			...backup05Information.information,
			itemCount: {
				...backup05Information.information.itemCount,
				numberBackups: 0
			}
		}
	};
};

export const backupSchemaMigrate_05to06 = (
	backup05: BackupSchemaRev05Type
): BackupSchemaRev06Type => {
	logging.info('Transforming Backup From Rev 05 to Rev 06');
	return {
		...backupSchemaMigrate_05to06Information({
			version: backup05.version,
			information: backup05.information
		}),
		data: {
			user: backup05.data.user,
			session: [],
			key: backup05.data.key,
			account: backup05.data.account,
			bill: backup05.data.bill,
			budget: backup05.data.budget,
			category: backup05.data.category,
			transaction: backup05.data.transaction,
			journalEntry: backup05.data.journalEntry,
			label: backup05.data.label,
			labelsToJournals: backup05.data.labelsToJournals,
			tag: backup05.data.tag,
			importItemDetail: backup05.data.importItemDetail,
			importTable: backup05.data.importTable,
			importMapping: backup05.data.importMapping,
			reusableFilter: backup05.data.reusableFilter,
			filter: backup05.data.filter,
			report: backup05.data.report,
			reportElement: backup05.data.reportElement,
			filtersToReportConfigs: backup05.data.filtersToReportConfigs,
			keyValueTable: backup05.data.keyValueTable,
			reportElementConfig: backup05.data.reportElementConfig,
			backup: []
		}
	};
};
