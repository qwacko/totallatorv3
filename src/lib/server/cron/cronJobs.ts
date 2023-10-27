import { updateManyTransferInfo } from '../db/actions/helpers/updateTransactionTransfer';
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
		schedule: '0 * * * *',
		job: async () => {
			logging.info('CRON: Updating Journal Transfer Settings');
			updateManyTransferInfo({ db: db });
		}
	}
];
