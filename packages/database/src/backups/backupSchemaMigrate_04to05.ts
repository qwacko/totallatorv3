import type { BackupSchemaRev05Type } from './backupSchema.Rev05';
import type { BackupSchemaRev04Type } from './backupSchema.Rev04';
import { getLogger } from '../logger';

export const backupSchemaMigrate_04to05Information = (
	backup04Information: Pick<BackupSchemaRev04Type, 'information' | 'version'>
): Pick<BackupSchemaRev05Type, 'information' | 'version'> => {
	return {
		version: 5,
		information: {
			...backup04Information.information
		}
	};
};

export const backupSchemaMigrate_04to05 = (
	backup04: BackupSchemaRev04Type
): BackupSchemaRev05Type => {
	getLogger().info('Transforming Backup From Rev 04 to Rev 05');
	return {
		...backupSchemaMigrate_04to05Information({
			version: backup04.version,
			information: backup04.information
		}),
		data: {
			user: backup04.data.user,
			session: [],
			key: backup04.data.key,
			account: backup04.data.account,
			bill: backup04.data.bill,
			budget: backup04.data.budget,
			category: backup04.data.category,
			transaction: backup04.data.transaction,
			journalEntry: backup04.data.journalEntry,
			label: backup04.data.label,
			labelsToJournals: backup04.data.labelsToJournals,
			tag: backup04.data.tag,
			importItemDetail: backup04.data.importItemDetail,
			importTable: backup04.data.importTable.map((item) => {
				return {
					...item,
					status: item.status === 'imported' ? 'complete' : item.status
				};
			}),
			importMapping: backup04.data.importMapping,
			reusableFilter: backup04.data.reusableFilter,
			filter: [],
			report: [],
			reportElement: [],
			filtersToReportConfigs: [],
			keyValueTable: [],
			reportElementConfig: []
		}
	};
};
