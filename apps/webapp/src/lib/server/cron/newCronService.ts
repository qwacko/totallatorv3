import { CronJobService } from "@totallator/business-logic";
import type { GlobalContext } from "@totallator/context";
import type { CoreDBType } from "@totallator/database";

let cronService: CronJobService | null = null;

/**
 * Initialize the new cron service
 */
export const initializeNewCronService = async (
  getContext: () => GlobalContext,
) => {
  if (cronService) {
    await cronService.shutdown();
  }

  const context = getContext();
  // Cast to CoreDBType since we know the GlobalContext.db is the actual database connection
  const coreDb = context.db as CoreDBType;
  cronService = new CronJobService(coreDb, getContext);
  await cronService.initialize();

  console.log("New cron service initialized successfully");
  return cronService;
};

/**
 * Get the current cron service instance
 */
export const getCronService = (): CronJobService | null => {
  return cronService;
};

/**
 * Gracefully shutdown the cron service
 */
export const shutdownCronService = async () => {
  if (cronService) {
    await cronService.shutdown();
    cronService = null;
    console.log("Cron service shutdown successfully");
  }
};
