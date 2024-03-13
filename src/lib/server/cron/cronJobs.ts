import { updateManyTransferInfo } from '../db/actions/helpers/journal/updateTransactionTransfer';
import { tActions } from '../db/actions/tActions';
import { db } from '../db/db';
import { logging } from '../logging';
import { auth } from '../lucia';
import { serverEnv } from '../serverEnv';
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
		name: 'Update Reusable Filters (Every 2 Minutes)',
		schedule: '*/2 * * * *',
		job: async () => {
			const startTime = new Date().getTime();
			const numberModified = await tActions.reusableFitler.refresh({
				db,
				maximumTime: 10000
			});

			if (numberModified > 0) {
				logging.debug(
					'CRON: Updating Reusable Filters - Took ' +
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
			await auth.deleteExpiredSessions();
		}
	}
];
