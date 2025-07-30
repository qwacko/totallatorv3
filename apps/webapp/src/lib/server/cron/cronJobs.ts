import { actionHelpers, tActions } from "@totallator/business-logic";

import { logging } from "../logging";
import { serverEnv } from "../serverEnv";
import type { CronJob } from "./cron";

export const cronJobs: CronJob[] = [
  {
    name: "Backup SQLite Database",
    schedule: serverEnv.BACKUP_SCHEDULE,
    job: async (context) => {
      logging.debug("CRON: Backing Up Database");
      await tActions.backup.storeBackup({
        db: context.db,
        title: "Scheduled Backup",
        compress: true,
        createdBy: "System",
        creationReason: "Scheduled Backup",
      });
    },
  },
  {
    name: "Regular Journal Cleanup / Fix",
    schedule: "0 * * * *",
    job: async (context) => {
      logging.debug("CRON: Updating Journal Transfer Settings");
      actionHelpers.updateManyTransferInfo({ db: context.db });
    },
  },
  {
    name: "Recurring Running Of Automatic Filters",
    schedule: serverEnv.AUTOMATIC_FILTER_SCHEDULE,
    job: async (context) => {
      const startTime = new Date().getTime();
      await tActions.reusableFitler.applyAllAutomatic({ db: context.db });
      logging.debug(
        "CRON: Running Automatic Filters - Took " +
          (new Date().getTime() - startTime) +
          "ms",
      );
    },
  },
  {
    name: "Update All Resuable Filters (Every Day)",
    schedule: "11 0 * * *",
    job: async (context) => {
      const startTime = new Date().getTime();
      const numberModified = await tActions.reusableFitler.refreshAll({
        db: context.db,
        maximumTime: 60000,
      });

      if (numberModified > 0) {
        logging.debug(
          "CRON: Updating All Reusable Filters - Took " +
            (new Date().getTime() - startTime) +
            "ms - Updated " +
            numberModified +
            " filters",
        );
      }
    },
  },
  {
    name: "Update Reusable Filters (Every hour)",
    schedule: "3 * * * *",
    job: async (context) => {
      const startTime = new Date().getTime();
      const numberModified = await tActions.reusableFitler.refresh({
        db: context.db,
        maximumTime: 60000,
      });

      if (numberModified > 0) {
        logging.debug(
          "CRON: Updating Reusable Filters Needing Update - Took " +
            (new Date().getTime() - startTime) +
            "ms - Updated " +
            numberModified +
            " filters",
        );
      }
    },
  },
  {
    name: "Cleanup Sessions",
    schedule: "0 0 * * *",
    job: async (context) => {
      await tActions.auth.deleteExpiredSessions(context.db);
    },
  },
  {
    name: "Automatic Import Processing",
    schedule: "* * * * * ",
    job: async (context) => {
      //This Runs Every Mintue, but doesn't allow for multiple imports to
      //occur at the same time within the function which is called.
      await tActions.import.doRequiredImports({ db: context.db });
    },
  },
  {
    name: "Regular Update And Cleansing Of Backups",
    schedule: "0 0 * * *",
    job: async (context) => {
      await tActions.backup.refreshList({ db : context.db});
      await tActions.backup.trimBackups({ db: context.db });
    },
  },
  {
    name: "Clean Old Imports",
    schedule: "0 1 * * *",
    job: async (context) => {
      await tActions.import.autoCleanAll({
        db: context.db,
        retainDays: serverEnv.IMPORT_RETENTION_DAYS,
      });
    },
  },
  {
    name: "Run Auto Imports - Daily",
    schedule: "0 2 * * *",
    job: async (context) => {
      await tActions.autoImport.triggerMany({ db: context.db, frequency: "daily" });
    },
  },
  {
    name: "Run Auto Imports - Weekly",
    schedule: "0 3 * * 0",
    job: async (context) => {
      await tActions.autoImport.triggerMany({ db: context.db, frequency: "weekly" });
    },
  },
  {
    name: "Run Auto Imports - Monthly",
    schedule: "0 4 1 * *",
    job: async (context) => {
      await tActions.autoImport.triggerMany({ db: context.db, frequency: "monthly" });
    },
  },
  {
    name: "Check Stored Files - Daily",
    schedule: "0 5 * * *",
    job: async (context) => {
      await tActions.file.checkFilesExist({ db: context.db });
      await tActions.file.updateLinked({ db: context.db });
    },
  },
  {
    name: "Process LLM Journal Reviews",
    schedule: serverEnv.LLM_REVIEW_SCHEDULE,
    job: async (context) => {
      if (!serverEnv.LLM_REVIEW_ENABLED) {
        return;
      }

      const llmProcessor = new actionHelpers.LLMJournalProcessingService(context.db);

      try {
        const result = await llmProcessor.processRequiredJournals({
          batchSize: 20, // Process smaller batches more frequently
          maxProcessingTime: 45000, // 45 seconds max
          skipIfNoProviders: true,
        });

        if (result.processed > 0 || result.errors > 0) {
          logging.info(
            `CRON: LLM Journal Processing - Processed: ${result.processed}, Errors: ${result.errors}, Duration: ${result.duration}ms`,
          );
        }
      } catch (error) {
        logging.error("CRON: LLM Journal Processing failed:", error);
      }
    },
  },
];
