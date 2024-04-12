import type { BackupSchemaRev08Type } from './backupSchema.Rev08';
import type { BackupSchemaRev09Type } from './backupSchema.Rev09';

export const backupSchemaMigrate_08to09Information = (
	backup08Information: Pick<BackupSchemaRev08Type, 'information' | 'version'>
): Pick<BackupSchemaRev09Type, 'information' | 'version'> => {
	return {
		version: 9,
		information: {
			...backup08Information.information,
			itemCount: {
				...backup08Information.information.itemCount
			}
		}
	};
};

export const backupSchemaMigrate_08to09 = (
	backup08: BackupSchemaRev08Type
): BackupSchemaRev09Type => {
	console.log('Transforming Backup From Rev 08 to Rev 09');
	return {
		...backupSchemaMigrate_08to09Information({
			version: backup08.version,
			information: backup08.information
		}),
		data: {
			user: backup08.data.user,
			session: [],
			key: backup08.data.key,
			account: backup08.data.account,
			bill: backup08.data.bill,
			budget: backup08.data.budget,
			category: backup08.data.category,
			transaction: backup08.data.transaction,
			journalEntry: backup08.data.journalEntry,
			label: backup08.data.label,
			labelsToJournals: backup08.data.labelsToJournals,
			tag: backup08.data.tag,
			importItemDetail: backup08.data.importItemDetail,
			importTable: backup08.data.importTable,
			autoImportTable: backup08.data.autoImportTable,
			importMapping: backup08.data.importMapping,
			reusableFilter: backup08.data.reusableFilter,
			filter: backup08.data.filter,
			report: backup08.data.report,
			reportElement: backup08.data.reportElement,
			filtersToReportConfigs: backup08.data.filtersToReportConfigs,
			keyValueTable: backup08.data.keyValueTable,
			reportElementConfig: backup08.data.reportElementConfig,
			backup: backup08.data.backup
		}
	};
};
