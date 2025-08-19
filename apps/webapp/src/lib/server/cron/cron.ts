import schedule from "node-schedule";

import type { GlobalContext } from "@totallator/context";
import { runWithContext } from "@totallator/context";

import { cronJobs } from "./cronJobs";

export type CronJob = {
  name: string;
  schedule: string;
  job: (context: GlobalContext) => Promise<void>;
};

// Create a minimal request context for cron jobs
function createCronRequestContext(jobName: string) {
  return {
    user: undefined,
    session: undefined,
    requestId: crypto.randomUUID(),
    startTime: Date.now(),
    event: {
      request: new Request(`http://localhost/cron/${jobName}`),
      locals: {},
      getClientAddress: () => "127.0.0.1",
    },
    userAgent: `Cron-Job-${jobName}`,
    ip: "127.0.0.1",
  };
}

export const processCronJobs = (
  getContext: () => GlobalContext,
  cronJobs: CronJob[],
) => {
  return cronJobs.map((cronJob) => {
    return schedule.scheduleJob(cronJob.name, cronJob.schedule, async () => {
      const context = getContext();
      const requestContext = createCronRequestContext(cronJob.name);

      try {
        await runWithContext(context, requestContext, async () => {
          await cronJob.job(context);
        });
      } catch (e) {
        context.logger("cron").error({
          data: { name: cronJob.name, schedule: cronJob.schedule, e },
          title: "Error in cron job",
          code: "CRON_0003",
        });
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
