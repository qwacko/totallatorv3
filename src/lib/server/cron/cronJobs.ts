import { updateManyTransferInfo } from '../db/actions/helpers/journal/updateTransactionTransfer';
import { tActions } from '../db/actions/tActions';
import { db } from '../db/db';
import { logging } from '../logging';
import { auth } from '../auth';
import { serverEnv } from '../serverEnv';
import { LLMJournalProcessingService } from '../services/llmJournalProcessingService';
import type { CronJob } from './cron';

export const cronJobs: CronJob[] = [
	{
		name: 'Backup SQLite Database',
		schedule: serverEnv.BACKUP_SCHEDULE,
		job: async () => {
			logging.debug('CRON: Backing Up Database');
			await tActions.backup.storeBackup({
				db: db,
				title: 'Scheduled Backup',
				compress: true,
				createdBy: 'System',
				creationReason: 'Scheduled Backup'
			});
		}
	},
	{
		name: 'Regular Journal Cleanup / Fix',
		schedule: '0 * * * *',
		job: async () => {
			logging.debug('CRON: Updating Journal Transfer Settings');
			updateManyTransferInfo({ db: db });
		}
	},
	{
		name: 'Recurring Running Of Automatic Filters',
		schedule: serverEnv.AUTOMATIC_FILTER_SCHEDULE,
		job: async () => {
			const startTime = new Date().getTime();
			await tActions.reusableFitler.applyAllAutomatic({ db });
			logging.debug(
				'CRON: Running Automatic Filters - Took ' + (new Date().getTime() - startTime) + 'ms'
			);
		}
	},
	{
		name: 'Update All Resuable Filters (Every Day)',
		schedule: '11 0 * * *',
		job: async () => {
			const startTime = new Date().getTime();
			const numberModified = await tActions.reusableFitler.refreshAll({
				db,
				maximumTime: 60000
			});

			if (numberModified > 0) {
				logging.debug(
					'CRON: Updating All Reusable Filters - Took ' +
						(new Date().getTime() - startTime) +
						'ms - Updated ' +
						numberModified +
						' filters'
				);
			}
		}
	},
	{
		name: 'Update Reusable Filters (Every hour)',
		schedule: '3 * * * *',
		job: async () => {
			const startTime = new Date().getTime();
			const numberModified = await tActions.reusableFitler.refresh({
				db,
				maximumTime: 60000
			});

			if (numberModified > 0) {
				logging.debug(
					'CRON: Updating Reusable Filters Needing Update - Took ' +
						(new Date().getTime() - startTime) +
						'ms - Updated ' +
						numberModified +
						' filters'
				);
			}
		}
	},
	{
		name: 'Cleanup Sessions',
		schedule: '0 0 * * *',
		job: async () => {
			await auth.deleteExpiredSessions(db);
		}
	},
	{
		name: 'Automatic Import Processing',
		schedule: '* * * * * ',
		job: async () => {
			//This Runs Every Mintue, but doesn't allow for multiple imports to
			//occur at the same time within the function which is called.
			await tActions.import.doRequiredImports({ db });
		}
	},
	{
		name: 'Regular Update And Cleansing Of Backups',
		schedule: '0 0 * * *',
		job: async () => {
			await tActions.backup.refreshList({ db });
			await tActions.backup.trimBackups({ db });
		}
	},
	{
		name: 'Clean Old Imports',
		schedule: '0 1 * * *',
		job: async () => {
			await tActions.import.autoCleanAll({ db, retainDays: serverEnv.IMPORT_RETENTION_DAYS });
		}
	},
	{
		name: 'Run Auto Imports - Daily',
		schedule: '0 2 * * *',
		job: async () => {
			await tActions.autoImport.triggerMany({ db, frequency: 'daily' });
		}
	},
	{
		name: 'Run Auto Imports - Weekly',
		schedule: '0 3 * * 0',
		job: async () => {
			await tActions.autoImport.triggerMany({ db, frequency: 'weekly' });
		}
	},
	{
		name: 'Run Auto Imports - Monthly',
		schedule: '0 4 1 * *',
		job: async () => {
			await tActions.autoImport.triggerMany({ db, frequency: 'monthly' });
		}
	},
	{
		name: 'Check Stored Files - Daily',
		schedule: '0 5 * * *',
		job: async () => {
			await tActions.file.checkFilesExist({ db });
			await tActions.file.updateLinked({ db });
		}
	},
	{
		name: 'Process LLM Journal Reviews',
		schedule: serverEnv.LLM_REVIEW_SCHEDULE,
		job: async () => {
			if (!serverEnv.LLM_REVIEW_ENABLED) {
				return;
			}

			const llmProcessor = new LLMJournalProcessingService(db);

			try {
				const result = await llmProcessor.processRequiredJournals({
					batchSize: 20, // Process smaller batches more frequently
					maxProcessingTime: 45000, // 45 seconds max
					skipIfNoProviders: true
				});

				if (result.processed > 0 || result.errors > 0) {
					logging.info(
						`CRON: LLM Journal Processing - Processed: ${result.processed}, Errors: ${result.errors}, Duration: ${result.duration}ms`
					);
				}
			} catch (error) {
				logging.error('CRON: LLM Journal Processing failed:', error);
			}
		}
	}
];
