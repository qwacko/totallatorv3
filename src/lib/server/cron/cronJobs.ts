import { tActions } from '../db/actions/tActions';
import { backupDB, db } from '../db/db';
import { logging } from '../logging';
import { serverEnv } from '../serverEnv';
import type { CronJob } from './cron';

export const cronJobs: CronJob[] = [
	{
		name: 'Backup SQLite Database',
		schedule: serverEnv.BACKUP_SCHEDULE,
		job: async () => {
			await backupDB('Scheduled Backup');
		}
	},
	{
		name: 'Regular Journal Cleanup / Fix',
		schedule: '* * * * *',
		job: async () => {
			const startTime = new Date();
			const { toCreateLength, toRemoveLength } = await tActions.journal.updateOtherJournals({ db });

			if (toCreateLength > 0 || toRemoveLength > 0) {
				const endTime = new Date();
				if (toCreateLength > 0) logging.info(`Created ${toCreateLength} new Other Journal Links`);
				if (toRemoveLength > 0) logging.info(`Removed ${toRemoveLength} Other Journal Links`);
				logging.info(`Regular Journal Cleanup took ${endTime.getTime() - startTime.getTime()}ms`);
			}
		}
	}
];
