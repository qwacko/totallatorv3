import schedule from "node-schedule";

import { logging } from "../logging";
import { cronJobs } from "./cronJobs";
import type { DBType } from "@totallator/database";

export type CronJob = {
  name: string;
  schedule: string;
  job: (context: CronjobContext) => void;
};

type CronjobContext = {
  db: DBType
}

export const processCronJobs = (getContext: () => CronjobContext, cronJobs: CronJob[]) => {
  return cronJobs.map((cronJob) => {
    return schedule.scheduleJob(cronJob.name, cronJob.schedule, () => {
      try {
        cronJob.job(getContext());
      } catch (e) {
        logging.error("Error in cron job", cronJob.name, cronJob.schedule, e);
      }
    });
  });
};

let cronJobsRunning: unknown | undefined | schedule.Job[];

export const initateCronJobs = (getContext: () => CronjobContext) => {
  if (cronJobsRunning || schedule.scheduledJobs) {
    //Cancels all the jobs before starting them again
    schedule.gracefulShutdown();
  }

  cronJobsRunning = processCronJobs(getContext, cronJobs);
};
