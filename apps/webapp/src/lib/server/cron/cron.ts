import { nanoid } from 'nanoid';
import schedule from 'node-schedule';

import type { CombinedContext, EnhancedRequestContext, GlobalContext } from '@totallator/context';

// import { cronJobs } from "./cronJobs";

export type CronJob = {
	name: string;
	schedule: string;
	job: (context: GlobalContext) => Promise<void>;
};

export const processCronJobs = (
	getContext: () => Promise<GlobalContext>,
	standaloneContext: <T>(
		metadata: Partial<EnhancedRequestContext>,
		callback: (context: CombinedContext<GlobalContext, EnhancedRequestContext>) => Promise<T> | T
	) => Promise<T>,
	cronJobs: CronJob[]
) => {
	return cronJobs.map((cronJob) => {
		return schedule.scheduleJob(cronJob.name, cronJob.schedule, async () => {
			try {
				await standaloneContext(
					{
						requestId: nanoid(),
						routeId: `cron/${cronJob.name}`,
						url: `/cron/${cronJob.name}`,
						method: 'CRON',
						startTime: Date.now(),
						ip: '127.0.0.1',
						userAgent: `Cron-Job-${cronJob.name}`
					},
					async (context: CombinedContext<GlobalContext, EnhancedRequestContext>) => {
						await cronJob.job(context.global);
					}
				);
			} catch (e) {
				// Get context for error logging - this should work since we're in a standalone context
				const context = await getContext();
				context.logger('cron').error({
					data: { name: cronJob.name, schedule: cronJob.schedule, e },
					title: 'Error in cron job',
					code: 'CRON_0003'
				});
			}
		});
	});
};

// let cronJobsRunning: unknown | undefined | schedule.Job[];

// export const initateCronJobs = (
//   getContext: () => Promise<GlobalContext>,
//   standaloneContext: <T>(
//     metadata: Partial<EnhancedRequestContext>,
//     callback: (context: CombinedContext<GlobalContext, EnhancedRequestContext>) => Promise<T> | T
//   ) => Promise<T>
// ) => {
//   if (cronJobsRunning || schedule.scheduledJobs) {
//     //Cancels all the jobs before starting them again
//     schedule.gracefulShutdown();
//   }

//   cronJobsRunning = processCronJobs(getContext, standaloneContext, cronJobs);
// };
