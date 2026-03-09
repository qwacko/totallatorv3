import type { DefaultJobMap, JobResult } from "./types.js";

export const TOTALLATOR_QUEUES = {
  CRON: "cron",
  BACKGROUND: "background",
  LONG_RUNNING: "long-running",
} as const;

export type CronControlJobData =
  | { action: "trigger"; jobId: string; userId?: string }
  | { action: "toggle"; jobId: string; isEnabled: boolean; modifiedBy: string }
  | { action: "resync" };

export type StagedFileData = {
  storageKey: string;
  originalName: string;
  mimeType: string;
};

export type BackupRestoreJobData = {
  backupId: string;
  includeUsers?: boolean;
  userId?: string;
};

export type BackupStoreJobData = {
  title: string;
  compress: boolean;
  createdBy: string;
  creationReason: string;
};

export type BackupImportJobData = {
  backupId: string;
  file: StagedFileData;
};

export type AutoImportTriggerJobData = {
  autoImportId: string;
  triggeredByUserId?: string;
};

export type ImportStoreJobData = {
  importType: "flatImport" | "mappedImport";
  importMappingId?: string;
  autoProcess: boolean;
  autoClean: boolean;
  checkImportedOnly: boolean;
  autoImportId?: string;
  file: StagedFileData;
};

export type TotallatorWorkerJobMap = DefaultJobMap & {
  "test-log-job": {
    data: {
      message: string;
    };
    result: JobResult;
  };
  "cron-control": {
    data: CronControlJobData;
    result: JobResult;
  };
  "cron-execute": {
    data: {
      cronJobId: string;
      triggeredBy?: "scheduler" | "manual" | "api";
      triggeredByUserId?: string;
      retryCount?: number;
    };
    result: JobResult;
  };
  "backup-restore": {
    data: BackupRestoreJobData;
    result: JobResult;
  };
  "backup-store": {
    data: BackupStoreJobData;
    result: JobResult;
  };
  "backup-refresh": {
    data: {};
    result: JobResult;
  };
  "backup-trim": {
    data: {};
    result: JobResult;
  };
  "backup-import": {
    data: BackupImportJobData;
    result: JobResult;
  };
  "auto-import-trigger": {
    data: AutoImportTriggerJobData;
    result: JobResult;
  };
  "import-store": {
    data: ImportStoreJobData;
    result: JobResult;
  };
  "import-reprocess": {
    data: { importId: string };
    result: JobResult;
  };
  "import-clean": {
    data: { importId: string };
    result: JobResult;
  };
  "import-trigger": {
    data: { importId: string };
    result: JobResult;
  };
  "backup-delete": {
    data: { backupId: string };
    result: JobResult;
  };
  "import-delete": {
    data: { importId: string };
    result: JobResult;
  };
  "import-delete-linked": {
    data: { importId: string };
    result: JobResult;
  };
  "import-forget": {
    data: { importId: string };
    result: JobResult;
  };
  "file-check-exists": {
    data: {};
    result: JobResult;
  };
};
