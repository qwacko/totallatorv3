import type { BackupSchemaRev02Type } from './backupSchema.Rev02';
import type { BackupSchemaRev03Type } from './backupSchema.Rev03';

export const backupSchemaMigrate_02to03 = (
	backup02: BackupSchemaRev02Type
): BackupSchemaRev03Type => {
	console.log('Transforming Backup From Rev 02 to Rev 03');
	return {
		version: 3,
		information: {
			...backup02.information,
			itemCount: {
				...backup02.information.itemCount,
				numberKeyValues: 0,
				numberReportElements: 0,
				numberReportFilters: 0,
				numberReportItems: 0,
				numberReports: 0
			}
		},
		data: {
			user: backup02.data.user,
			session: backup02.data.session.map((session) => ({
				...session,
				activeExpires: Number(session.activeExpires),
				idleExpires: Number(session.idleExpires)
			})),
			key: backup02.data.key,
			account: backup02.data.account.map((account) => ({
				...account,
				status: 'active',
				allowUpdate: true,
				disabled: false,
				active: true
			})),
			bill: backup02.data.bill,
			budget: backup02.data.budget,
			category: backup02.data.category,
			transaction: backup02.data.transaction,
			journalEntry: backup02.data.journalEntry,
			label: backup02.data.label,
			labelsToJournals: backup02.data.labelsToJournals,
			tag: backup02.data.tag,
			importItemDetail: backup02.data.importItemDetail,
			importTable: backup02.data.importTable,
			importMapping: backup02.data.importMapping,
			reusableFilter: backup02.data.reusableFilter,
			filter: [],
			report: [],
			reportElement: [],
			filtersToReportConfigs: [],
			keyValueTable: [],
			reportElementConfig: []
		}
	};
};
