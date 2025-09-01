import { actionHelpers, tActions } from '@totallator/business-logic';

import { serverEnv } from '../serverEnv';
import type { CronJob } from './cron';

export const cronJobs: CronJob[] = [
	{
		name: 'Backup SQLite Database',
		schedule: serverEnv.BACKUP_SCHEDULE,
		job: async (context) => {
			context.logger('cron').debug({ code: 'CRON_004', title: 'CRON: Backing Up Database' });
			await tActions.backup.storeBackup({
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
		job: async (context) => {
			context.logger('cron').debug({
				title: 'CRON: Updating Journal Transfer Settings',
				code: 'CRON_0005'
			});
			actionHelpers.updateManyTransferInfo({ db: context.db });
		}
	},
	{
		name: 'Recurring Running Of Automatic Filters',
		schedule: serverEnv.AUTOMATIC_FILTER_SCHEDULE,
		job: async (context) => {
			const startTime = new Date().getTime();
			await tActions.reusableFitler.applyAllAutomatic();
			context.logger('cron').debug({
				title:
					'CRON: Running Automatic Filters - Took ' + (new Date().getTime() - startTime) + 'ms',
				code: 'CRON_0006'
			});
		}
	},
	{
		name: 'Update All Resuable Filters (Every Day)',
		schedule: '11 0 * * *',
		job: async (context) => {
			const startTime = new Date().getTime();
			const numberModified = await tActions.reusableFitler.refreshAll({
				maximumTime: 60000
			});

			if (numberModified > 0) {
				context.logger('cron').debug({
					title:
						'CRON: Updating All Reusable Filters - Took ' +
						(new Date().getTime() - startTime) +
						'ms - Updated ' +
						numberModified +
						' filters',
					code: 'CRON_0007'
				});
			}
		}
	},
	{
		name: 'Update Reusable Filters (Every hour)',
		schedule: '3 * * * *',
		job: async (context) => {
			const startTime = new Date().getTime();
			const numberModified = await tActions.reusableFitler.refresh({
				maximumTime: 60000
			});

			if (numberModified > 0) {
				context.logger('cron').debug({
					title:
						'CRON: Updating Reusable Filters Needing Update - Took ' +
						(new Date().getTime() - startTime) +
						'ms - Updated ' +
						numberModified +
						' filters',
					code: 'CRON_0008'
				});
			}
		}
	},
	{
		name: 'Cleanup Sessions',
		schedule: '0 0 * * *',
		job: async (context) => {
			await tActions.auth.deleteExpiredSessions();
		}
	},
	{
		name: 'Automatic Import Processing',
		schedule: '* * * * * ',
		job: async (context) => {
			//This Runs Every Mintue, but doesn't allow for multiple imports to
			//occur at the same time within the function which is called.
			await tActions.import.doRequiredImports();
		}
	},
	{
		name: 'Regular Update And Cleansing Of Backups',
		schedule: '0 0 * * *',
		job: async (context) => {
			await tActions.backup.refreshList();
			await tActions.backup.trimBackups();
		}
	},
	{
		name: 'Clean Old Imports',
		schedule: '0 1 * * *',
		job: async (context) => {
			await tActions.import.autoCleanAll({
				retainDays: serverEnv.IMPORT_RETENTION_DAYS
			});
		}
	},
	{
		name: 'Run Auto Imports - Daily',
		schedule: '0 2 * * *',
		job: async (context) => {
			await tActions.autoImport.triggerMany({
				frequency: 'daily'
			});
		}
	},
	{
		name: 'Run Auto Imports - Weekly',
		schedule: '0 3 * * 0',
		job: async (context) => {
			await tActions.autoImport.triggerMany({
				frequency: 'weekly'
			});
		}
	},
	{
		name: 'Run Auto Imports - Monthly',
		schedule: '0 4 1 * *',
		job: async (context) => {
			await tActions.autoImport.triggerMany({
				frequency: 'monthly'
			});
		}
	},
	{
		name: 'Check Stored Files - Daily',
		schedule: '0 5 * * *',
		job: async (context) => {
			await tActions.file.checkFilesExist();
			await tActions.file.updateLinked();
		}
	},
	// {
	// 	name: 'Process LLM Journal Reviews',
	// 	schedule: serverEnv.LLM_REVIEW_SCHEDULE,
	// 	job: async (context) => {
	// 		if (!serverEnv.LLM_REVIEW_ENABLED) {
	// 			return;
	// 		}

	// 		const llmProcessor = new actionHelpers.LLMJournalProcessingService(context.db);

	// 		try {
	// 			const result = await llmProcessor.processRequiredJournals({
	// 				batchSize: 20, // Process smaller batches more frequently
	// 				maxProcessingTime: 45000, // 45 seconds max
	// 				skipIfNoProviders: true
	// 			});

	// 			if (result.processed > 0 || result.errors > 0) {
	// 				context.logger('cron').info({
	// 					title: `CRON: LLM Journal Processing - Processed: ${result.processed}, Errors: ${result.errors}, Duration: ${result.duration}ms`,
	// 					code: 'CRON_0009'
	// 				});
	// 			}
	// 		} catch (error) {
	// 			context.logger('cron').error({
	// 				title: 'CRON: LLM Journal Processing failed:',
	// 				error,
	// 				code: 'CRON_0010'
	// 			});
	// 		}
	// 	}
	// },
	{
		name: 'Clear Logs',
		schedule: '0 5 * * *',
		job: async (context) => {
			const numberDeleted = await context.logging.deleteOldLogs({
				maxCount: context.serverEnv.LOG_DATABASE_MAX_ENTRIES,
				olderThanDays: context.serverEnv.LOG_DATABASE_MAX_AGE_DAYS
			});

			if (numberDeleted > 0) {
				context.logger('cron').info({
					title: `Cleaned up ${numberDeleted} log entries`,
					code: 'CRON_0011'
				});
			}
		}
	}
];
