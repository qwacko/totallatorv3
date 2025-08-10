import type { BackupSchemaRev07Type } from './backupSchema.Rev07';
import type { BackupSchemaRev06Type } from './backupSchema.Rev06';
import { getLogger } from '../logger';

export const backupSchemaMigrate_06to07Information = (
	backup06Information: Pick<BackupSchemaRev06Type, 'information' | 'version'>
): Pick<BackupSchemaRev07Type, 'information' | 'version'> => {
	return {
		version: 7,
		information: {
			...backup06Information.information,
			itemCount: {
				...backup06Information.information.itemCount,
				numberAutoImport: 0
			}
		}
	};
};

export const backupSchemaMigrate_06to07 = (
	backup06: BackupSchemaRev06Type
): BackupSchemaRev07Type => {
	getLogger().info('Transforming Backup From Rev 06 to Rev 07');
	return {
		...backupSchemaMigrate_06to07Information({
			version: backup06.version,
			information: backup06.information
		}),
		data: {
			user: backup06.data.user,
			session: [],
			key: backup06.data.key,
			account: backup06.data.account,
			bill: backup06.data.bill,
			budget: backup06.data.budget,
			category: backup06.data.category,
			transaction: backup06.data.transaction,
			journalEntry: backup06.data.journalEntry,
			label: backup06.data.label,
			labelsToJournals: backup06.data.labelsToJournals,
			tag: backup06.data.tag,
			importItemDetail: backup06.data.importItemDetail,
			importTable: backup06.data.importTable.map((item) => ({
				...item,
				autoProcess: false,
				autoClean: false
			})),
			autoImportTable: [],
			importMapping: backup06.data.importMapping,
			reusableFilter: backup06.data.reusableFilter,
			filter: backup06.data.filter,
			report: backup06.data.report,
			reportElement: backup06.data.reportElement,
			filtersToReportConfigs: backup06.data.filtersToReportConfigs,
			keyValueTable: backup06.data.keyValueTable,
			reportElementConfig: backup06.data.reportElementConfig,
			backup: []
		}
	};
};
