import { updateManyTransferInfo } from '../db/actions/helpers/updateTransactionTransfer';
import { summaryActions } from '../db/actions/summaryActions';
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
	},
	{
		name: 'Regular Update Of All Summaries (Hourly)',
		schedule: '0 * * * *',
		job: async () => {
			logging.info('CRON: Updating All Summaries (Hourly)');
			await summaryActions.updateAndCreateMany({ db, needsUpdateOnly: false, allowCreation: true });
		}
	},
	{
		name: 'Regular Addition Of New Summaries + Needs Update (every 5 minutes)',
		schedule: '*/5 * * * *',
		job: async () => {
			await summaryActions.createMissing({ db });
			await summaryActions.updateAndCreateMany({ db, needsUpdateOnly: true, allowCreation: true });
		}
	}
];
