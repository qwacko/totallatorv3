import type { BackupSchemaRev10Type } from './backupSchema.Rev10';
import type { BackupSchemaRev11Type } from './backupSchema.Rev11';
import { getLogger } from '../logger';

export const backupSchemaMigrate_10to11Information = (
	backup10Information: Pick<BackupSchemaRev10Type, 'information' | 'version'>
): Pick<BackupSchemaRev11Type, 'information' | 'version'> => {
	return {
		version: 11,
		information: {
			...backup10Information.information,
			itemCount: {
				...backup10Information.information.itemCount,
				numberAssociatedInfo:
					backup10Information.information.itemCount.numberFiles +
					backup10Information.information.itemCount.numberNotes
			}
		}
	};
};

export const backupSchemaMigrate_10to11 = (
	backup10: BackupSchemaRev10Type
): BackupSchemaRev11Type => {
	getLogger().info('Transforming Backup From Rev 10 to Rev 11');
	return {
		...backupSchemaMigrate_10to11Information({
			version: backup10.version,
			information: backup10.information
		}),
		data: {
			user: backup10.data.user,
			session: [],
			key: backup10.data.key,
			account: backup10.data.account,
			bill: backup10.data.bill,
			budget: backup10.data.budget,
			category: backup10.data.category,
			transaction: backup10.data.transaction,
			journalEntry: backup10.data.journalEntry,
			label: backup10.data.label,
			labelsToJournals: backup10.data.labelsToJournals,
			tag: backup10.data.tag,
			importItemDetail: backup10.data.importItemDetail,
			importTable: backup10.data.importTable,
			autoImportTable: backup10.data.autoImportTable,
			importMapping: backup10.data.importMapping,
			reusableFilter: backup10.data.reusableFilter,
			//@ts-expect-error Not Sure Here
			filter: backup10.data.filter,
			report: backup10.data.report,
			reportElement: backup10.data.reportElement,
			filtersToReportConfigs: backup10.data.filtersToReportConfigs,
			keyValueTable: backup10.data.keyValueTable,
			reportElementConfig: backup10.data.reportElementConfig,
			backup: backup10.data.backup,
			note: backup10.data.note.map((note) => {
				const {
					accountId,
					transactionId,
					labelId,
					billId,
					budgetId,
					tagId,
					categoryId,
					createdById,
					reportId,
					reportElementId,
					autoImportId,
					fileId,
					...restNoteData
				} = note;

				return {
					...restNoteData,
					associatedInfoId: note.id
				};
			}),
			file: backup10.data.file.map((file) => {
				const {
					accountId,
					transactionId,
					labelId,
					billId,
					budgetId,
					tagId,
					categoryId,
					createdById,
					reportId,
					reportElementId,
					autoImportId,
					linked,
					...restFileData
				} = file;

				return {
					...restFileData,
					associatedInfoId: file.id
				};
			}),
			associatedInfo: [
				...backup10.data.note.map((note) => ({ ...note, linked: true })),
				...backup10.data.file
			].map((item) => ({
				id: item.id,
				createdById: item.createdById,
				createdAt: item.createdAt,
				updatedAt: item.updatedAt,
				accountId: item.accountId,
				transactionId: item.transactionId,
				labelId: item.labelId,
				billId: item.billId,
				budgetId: item.budgetId,
				tagId: item.tagId,
				categoryId: item.categoryId,
				reportId: item.reportId,
				reportElementId: item.reportElementId,
				autoImportId: item.autoImportId,
				title: null,
				linked: item.linked
			}))
		}
	};
};
