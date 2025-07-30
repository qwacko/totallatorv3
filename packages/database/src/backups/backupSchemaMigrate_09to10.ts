import type { BackupSchemaRev09Type } from './backupSchema.Rev09';
import type { BackupSchemaRev10Type } from './backupSchema.Rev10';
import { getLogger } from '../logger';

export const backupSchemaMigrate_09to10Information = (
	backup09Information: Pick<BackupSchemaRev09Type, 'information' | 'version'>
): Pick<BackupSchemaRev10Type, 'information' | 'version'> => {
	return {
		version: 10,
		information: {
			...backup09Information.information,
			itemCount: {
				...backup09Information.information.itemCount,
				numberFiles: 0,
				numberNotes: 0
			}
		}
	};
};

export const backupSchemaMigrate_09to10 = (
	backup09: BackupSchemaRev09Type,
): BackupSchemaRev10Type => {
	getLogger().info('Transforming Backup From Rev 09 to Rev 10');
	return {
		...backupSchemaMigrate_09to10Information({
			version: backup09.version,
			information: backup09.information
		}),
		data: {
			user: backup09.data.user,
			session: [],
			key: backup09.data.key,
			account: backup09.data.account,
			bill: backup09.data.bill,
			budget: backup09.data.budget,
			category: backup09.data.category,
			transaction: backup09.data.transaction,
			journalEntry: backup09.data.journalEntry,
			label: backup09.data.label,
			labelsToJournals: backup09.data.labelsToJournals,
			tag: backup09.data.tag,
			importItemDetail: backup09.data.importItemDetail,
			importTable: backup09.data.importTable,
			autoImportTable: backup09.data.autoImportTable,
			importMapping: backup09.data.importMapping,
			reusableFilter: backup09.data.reusableFilter,
			filter: backup09.data.filter,
			report: backup09.data.report,
			reportElement: backup09.data.reportElement,
			filtersToReportConfigs: backup09.data.filtersToReportConfigs,
			keyValueTable: backup09.data.keyValueTable,
			reportElementConfig: backup09.data.reportElementConfig,
			backup: backup09.data.backup,
			note: [],
			file: []
		}
	};
};
