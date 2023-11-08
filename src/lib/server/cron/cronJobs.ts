import { updateManyTransferInfo } from '../db/actions/helpers/updateTransactionTransfer';
import { summaryActions } from '../db/actions/summaryActions';
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
			const startTime = new Date().getTime();
			await summaryActions.updateAndCreateMany({ db, needsUpdateOnly: false, allowCreation: true });
			logging.info(
				'CRON: Updated All Summaries (Hourly) - Took ' + (new Date().getTime() - startTime) + 'ms'
			);
		}
	},
	{
		name: 'Regular Addition Of New Summaries + Needs Update (every 5 minutes)',
		schedule: '*/5 * * * *',
		job: async () => {
			const startTime = new Date().getTime();
			await summaryActions.createMissing({ db });
			await summaryActions.updateAndCreateMany({ db, needsUpdateOnly: true, allowCreation: true });
			logging.info(
				'CRON: Creating and Updating Summaries that Need Update - Took ' +
					(new Date().getTime() - startTime) +
					'ms'
			);
		}
	},
	{
		name: 'Recurring Running Of Automatic Filters',
		schedule: serverEnv.AUTOMATIC_FILTER_SCHEDULE,
		job: async () => {
			const startTime = new Date().getTime();
			await tActions.reusableFitler.applyAllAutomatic({ db });
			logging.info(
				'CRON: Running Automatic Filters - Took ' + (new Date().getTime() - startTime) + 'ms'
			);
		}
	}
];
