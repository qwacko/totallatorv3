import type { BackupSchemaRev07Type } from './backupSchema.Rev07';
import type { BackupSchemaRev08Type } from './backupSchema.Rev08';

export const backupSchemaMigrate_07to08Information = (
	backup07Information: Pick<BackupSchemaRev07Type, 'information' | 'version'>
): Pick<BackupSchemaRev08Type, 'information' | 'version'> => {
	return {
		version: 8,
		information: {
			...backup07Information.information,
			itemCount: {
				...backup07Information.information.itemCount
			}
		}
	};
};

export const backupSchemaMigrate_07to08 = (
	backup07: BackupSchemaRev07Type
): BackupSchemaRev08Type => {
	console.log('Transforming Backup From Rev 07 to Rev 08');
	return {
		...backupSchemaMigrate_07to08Information({
			version: backup07.version,
			information: backup07.information
		}),
		data: {
			user: backup07.data.user,
			session: [],
			key: backup07.data.key,
			account: backup07.data.account,
			bill: backup07.data.bill,
			budget: backup07.data.budget,
			category: backup07.data.category,
			transaction: backup07.data.transaction,
			journalEntry: backup07.data.journalEntry,
			label: backup07.data.label,
			labelsToJournals: backup07.data.labelsToJournals,
			tag: backup07.data.tag,
			importItemDetail: backup07.data.importItemDetail,
			importTable: backup07.data.importTable,
			autoImportTable: backup07.data.autoImportTable,
			importMapping: backup07.data.importMapping,
			reusableFilter: backup07.data.reusableFilter,
			filter: backup07.data.filter,
			report: backup07.data.report,
			reportElement: backup07.data.reportElement,
			filtersToReportConfigs: backup07.data.filtersToReportConfigs,
			keyValueTable: backup07.data.keyValueTable,
			reportElementConfig: backup07.data.reportElementConfig,
			backup: backup07.data.backup
		}
	};
};
