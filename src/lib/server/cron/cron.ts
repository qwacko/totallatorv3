import schedule from 'node-schedule';
import { cronJobs } from './cronJobs';
import { logging } from '../logging';

export type CronJob = {
	name: string;
	schedule: string;
	job: () => void;
};

export const processCronJobs = (cronJobs: CronJob[]) => {
	return cronJobs.map((cronJob) => {
		return schedule.scheduleJob(cronJob.name, cronJob.schedule, () => {
			try {
				cronJob.job();
			} catch (e) {
				logging.error('Error in cron job', cronJob.name, cronJob.schedule, e);
			}
		});
	});
};

let cronJobsRunning: unknown | undefined | schedule.Job[];

export const initateCronJobs = () => {
	if (cronJobsRunning || schedule.scheduledJobs) {
		//Cancels all the jobs before starting them again
		schedule.gracefulShutdown();
	}

	cronJobsRunning = processCronJobs(cronJobs);
};
