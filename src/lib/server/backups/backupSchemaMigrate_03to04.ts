import type { BackupSchemaRev04Type } from './backupSchema.Rev04';
import type { BackupSchemaRev03Type } from './backupSchema.Rev03';

export const backupSchemaMigrate_03to04 = (
	backup03: BackupSchemaRev03Type
): BackupSchemaRev04Type => {
	console.log('Transforming Backup From Rev 03 to Rev 04');
	return {
		version: 4,
		information: {
			...backup03.information
		},
		data: {
			user: backup03.data.user,
			session: [],
			key: backup03.data.key,
			account: backup03.data.account,
			bill: backup03.data.bill,
			budget: backup03.data.budget,
			category: backup03.data.category,
			transaction: backup03.data.transaction,
			journalEntry: backup03.data.journalEntry,
			label: backup03.data.label,
			labelsToJournals: backup03.data.labelsToJournals,
			tag: backup03.data.tag,
			importItemDetail: backup03.data.importItemDetail,
			importTable: backup03.data.importTable,
			importMapping: backup03.data.importMapping,
			reusableFilter: backup03.data.reusableFilter,
			filter: [],
			report: [],
			reportElement: [],
			filtersToReportConfigs: [],
			keyValueTable: [],
			reportElementConfig: []
		}
	};
};
