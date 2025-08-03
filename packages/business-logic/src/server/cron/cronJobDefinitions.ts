// @ts-nocheck
import { tActions } from '../../actions/tActions';
import { updateManyTransferInfo } from '../../actions/helpers/journal/updateTransactionTransfer';
import { LLMJournalProcessingService } from '../services/llmJournalProcessingService';
import type { CronJobDefinition } from './types';

/**
 * Collection of all cron job definitions for the application.
 * These definitions specify what jobs are available and their default configuration.
 */
export const cronJobDefinitions: CronJobDefinition[] = [
  {
    id: 'backup-database',
    name: 'Backup Database',
    description: 'Creates a scheduled backup of the database with compression',
    schedule: '${BACKUP_SCHEDULE}', // Will be replaced with actual env var
    isEnabled: true,
    timeoutMs: 300000, // 5 minutes
    maxRetries: 2,
    job: async (context) => {
      const startTime = Date.now();
      try {
        await tActions.backup.storeBackup({
          title: 'Scheduled Backup',
          compress: true,
          createdBy: 'System',
          creationReason: 'Scheduled Backup',
        });
        
        return {
          success: true,
          message: 'Database backup completed successfully',
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Database backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      }
    },
  },

  {
    id: 'journal-cleanup',
    name: 'Journal Cleanup',
    description: 'Updates journal transfer settings and performs cleanup operations',
    schedule: '0 * * * *', // Every hour
    isEnabled: true,
    timeoutMs: 120000, // 2 minutes
    maxRetries: 1,
    job: async (context) => {
      const startTime = Date.now();
      try {
        const result = await updateManyTransferInfo({ db: context.db });
        
        return {
          success: true,
          message: 'Journal cleanup completed successfully',
          data: { transfersUpdated: result },
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Journal cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      }
    },
  },

  {
    id: 'automatic-filters',
    name: 'Apply Automatic Filters',
    description: 'Runs all automatic reusable filters to categorize and process journals',
    schedule: '${AUTOMATIC_FILTER_SCHEDULE}', // Will be replaced with actual env var
    isEnabled: true,
    timeoutMs: 180000, // 3 minutes
    maxRetries: 1,
    job: async (context) => {
      const startTime = Date.now();
      try {
        await tActions.reusableFitler.applyAllAutomatic();
        
        return {
          success: true,
          message: 'Automatic filters applied successfully',
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Automatic filters failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      }
    },
  },

  {
    id: 'refresh-all-filters-daily',
    name: 'Refresh All Reusable Filters (Daily)',
    description: 'Updates all reusable filters once per day with extended processing time',
    schedule: '11 0 * * *', // Daily at 00:11
    isEnabled: true,
    timeoutMs: 300000, // 5 minutes
    maxRetries: 1,
    job: async (context) => {
      const startTime = Date.now();
      try {
        const numberModified = await tActions.reusableFitler.refreshAll({
          maximumTime: 60000,
        });

        return {
          success: true,
          message: `Refreshed all reusable filters successfully`,
          data: { filtersUpdated: numberModified },
          metrics: {
            itemsProcessed: numberModified,
            executionTimeMs: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Filter refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      }
    },
  },

  {
    id: 'refresh-filters-hourly',
    name: 'Refresh Reusable Filters (Hourly)',
    description: 'Updates reusable filters that need refreshing every hour',
    schedule: '3 * * * *', // Every hour at 3 minutes past
    isEnabled: true,
    timeoutMs: 180000, // 3 minutes
    maxRetries: 1,
    job: async (context) => {
      const startTime = Date.now();
      try {
        const numberModified = await tActions.reusableFitler.refresh({
          maximumTime: 60000,
        });

        return {
          success: true,
          message: `Refreshed reusable filters needing update`,
          data: { filtersUpdated: numberModified },
          metrics: {
            itemsProcessed: numberModified,
            executionTimeMs: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Filter refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      }
    },
  },

  {
    id: 'cleanup-sessions',
    name: 'Cleanup Expired Sessions',
    description: 'Removes expired user sessions from the database',
    schedule: '0 0 * * *', // Daily at midnight
    isEnabled: true,
    timeoutMs: 60000, // 1 minute
    maxRetries: 1,
    job: async (context) => {
      const startTime = Date.now();
      try {
        await tActions.auth.deleteExpiredSessions();
        
        return {
          success: true,
          message: 'Expired sessions cleaned up successfully',
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Session cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      }
    },
  },

  {
    id: 'automatic-import-processing',
    name: 'Automatic Import Processing',
    description: 'Processes pending automatic imports every minute (rate-limited internally)',
    schedule: '* * * * *', // Every minute
    isEnabled: true,
    timeoutMs: 300000, // 5 minutes
    maxRetries: 0, // No retries for frequent job
    job: async (context) => {
      const startTime = Date.now();
      try {
        await tActions.import.doRequiredImports();
        
        return {
          success: true,
          message: 'Automatic import processing completed',
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Import processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      }
    },
  },

  {
    id: 'backup-maintenance',
    name: 'Backup Maintenance',
    description: 'Refreshes backup list and trims old backups according to retention policy',
    schedule: '0 0 * * *', // Daily at midnight
    isEnabled: true,
    timeoutMs: 180000, // 3 minutes
    maxRetries: 1,
    job: async (context) => {
      const startTime = Date.now();
      try {
        await tActions.backup.refreshList();
        await tActions.backup.trimBackups();
        
        return {
          success: true,
          message: 'Backup maintenance completed successfully',
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Backup maintenance failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      }
    },
  },

  {
    id: 'clean-old-imports',
    name: 'Clean Old Imports',
    description: 'Removes old import records based on retention policy',
    schedule: '0 1 * * *', // Daily at 1 AM
    isEnabled: true,
    timeoutMs: 180000, // 3 minutes
    maxRetries: 1,
    job: async (context) => {
      const startTime = Date.now();
      try {
        await tActions.import.autoCleanAll({
          retainDays: Number(process.env.IMPORT_RETENTION_DAYS) || 30,
        });
        
        return {
          success: true,
          message: 'Old imports cleaned successfully',
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Import cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      }
    },
  },

  {
    id: 'auto-import-daily',
    name: 'Trigger Daily Auto Imports',
    description: 'Triggers automatic imports configured for daily frequency',
    schedule: '0 2 * * *', // Daily at 2 AM
    isEnabled: true,
    timeoutMs: 1800000, // 30 minutes
    maxRetries: 1,
    job: async (context) => {
      const startTime = Date.now();
      try {
        await tActions.autoImport.triggerMany({
          frequency: 'daily',
        });
        
        return {
          success: true,
          message: 'Daily auto imports triggered successfully',
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Daily auto import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      }
    },
  },

  {
    id: 'auto-import-weekly',
    name: 'Trigger Weekly Auto Imports',
    description: 'Triggers automatic imports configured for weekly frequency',
    schedule: '0 3 * * 0', // Weekly on Sundays at 3 AM
    isEnabled: true,
    timeoutMs: 1800000, // 30 minutes
    maxRetries: 1,
    job: async (context) => {
      const startTime = Date.now();
      try {
        await tActions.autoImport.triggerMany({
          frequency: 'weekly',
        });
        
        return {
          success: true,
          message: 'Weekly auto imports triggered successfully',
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Weekly auto import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      }
    },
  },

  {
    id: 'auto-import-monthly',
    name: 'Trigger Monthly Auto Imports',
    description: 'Triggers automatic imports configured for monthly frequency',
    schedule: '0 4 1 * *', // Monthly on the 1st at 4 AM
    isEnabled: true,
    timeoutMs: 1800000, // 30 minutes
    maxRetries: 1,
    job: async (context) => {
      const startTime = Date.now();
      try {
        await tActions.autoImport.triggerMany({
          frequency: 'monthly',
        });
        
        return {
          success: true,
          message: 'Monthly auto imports triggered successfully',
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `Monthly auto import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      }
    },
  },

  {
    id: 'check-stored-files',
    name: 'Check Stored Files',
    description: 'Verifies file integrity and updates linked file information',
    schedule: '0 5 * * *', // Daily at 5 AM
    isEnabled: true,
    timeoutMs: 600000, // 10 minutes
    maxRetries: 1,
    job: async (context) => {
      const startTime = Date.now();
      try {
        await tActions.file.checkFilesExist();
        await tActions.file.updateLinked();
        
        return {
          success: true,
          message: 'File integrity check completed successfully',
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `File check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      }
    },
  },

  {
    id: 'llm-journal-processing',
    name: 'Process LLM Journal Reviews',
    description: 'Processes journals for LLM-based categorization and recommendations',
    schedule: '${LLM_REVIEW_SCHEDULE}', // Will be replaced with actual env var
    isEnabled: true,
    timeoutMs: 300000, // 5 minutes
    maxRetries: 1,
    job: async (context) => {
      const startTime = Date.now();
      try {
        // Check if LLM processing is enabled
        if (!process.env.LLM_REVIEW_ENABLED || process.env.LLM_REVIEW_ENABLED !== 'true') {
          return {
            success: true,
            message: 'LLM review processing is disabled',
            metrics: {
              executionTimeMs: Date.now() - startTime,
            },
          };
        }

        const llmProcessor = new LLMJournalProcessingService(context.db);

        const result = await llmProcessor.processRequiredJournals({
          batchSize: 20,
          maxProcessingTime: 45000,
          skipIfNoProviders: true,
        });

        return {
          success: true,
          message: `LLM journal processing completed`,
          data: {
            processed: result.processed,
            errors: result.errors,
            duration: result.duration,
          },
          metrics: {
            itemsProcessed: result.processed,
            executionTimeMs: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `LLM journal processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metrics: {
            executionTimeMs: Date.now() - startTime,
          },
        };
      }
    },
  },
];