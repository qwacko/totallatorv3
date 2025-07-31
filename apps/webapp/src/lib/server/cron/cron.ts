import schedule from "node-schedule";

import { cronJobs } from "./cronJobs";
import type { GlobalContext } from "@totallator/context";

export type CronJob = {
  name: string;
  schedule: string;
  job: (context: GlobalContext) => void;
};


export const processCronJobs = (getContext: () => GlobalContext, cronJobs: CronJob[]) => {
  return cronJobs.map((cronJob) => {
    return schedule.scheduleJob(cronJob.name, cronJob.schedule, () => {
      try {
        cronJob.job(getContext());
      } catch (e) {
        getContext().logger.error("Error in cron job", cronJob.name, cronJob.schedule, e);
      }
    });
  });
};

let cronJobsRunning: unknown | undefined | schedule.Job[];

export const initateCronJobs = (getContext: () => GlobalContext) => {
  if (cronJobsRunning || schedule.scheduledJobs) {
    //Cancels all the jobs before starting them again
    schedule.gracefulShutdown();
  }

  cronJobsRunning = processCronJobs(getContext, cronJobs);
};
