import { getContextEventEmitter, type EventListener, getContextDB } from '@totallator/context';
import { backupActions } from '../actions/backupActions.js';
import { keyValueStore } from '../actions/helpers/keyValueStore.js';
import { keyValueTable } from '@totallator/database';
import { like, eq } from 'drizzle-orm';
import { dbExecuteLogger } from '../server/db/dbLogger.js';

/**
 * Set up event listeners for business logic operations
 * 
 * This module contains all the event callbacks that should be triggered
 * when various events occur throughout the application.
 * 
 * To add event listeners:
 * 1. Define your event in AppEvents interface (eventEmitter.ts)
 * 2. Create a handler function using EventListener<'event.name'>
 * 3. Register it in the initializeEventCallbacks function
 */

/**
 * Handle backup restore trigger events
 * This runs the actual backup restoration in the background
 */
const onBackupRestoreTriggered: EventListener<'backup.restore.triggered'> = async ({ 
  backupId, 
  includeUsers, 
  userId 
}) => {
  try {
    console.log('Starting background backup restore:', { backupId, includeUsers, userId });
    
    // Run the actual backup restore (this is the existing logic)
    await backupActions.restoreBackup({ 
      id: backupId, 
      includeUsers, 
      userId 
    });
    
    console.log('Background backup restore completed successfully:', { backupId });
  } catch (error) {
    console.error('Background backup restore failed:', { 
      backupId, 
      error: error instanceof Error ? error.message : String(error) 
    });
    // The restoreBackup function already emits the failure event
  }
};

/**
 * Handle backup restore progress events
 * This updates the KV store with progress information
 */
const onBackupRestoreProgress: EventListener<'backup.restore.progress'> = async ({ 
  backupId, 
  phase, 
  current, 
  total, 
  message,
  userId 
}) => {
  try {
    const progressData = {
      backupId,
      phase,
      current,
      total,
      percentage: Math.round((current / total) * 100),
      message: message || '',
      updatedAt: new Date().toISOString(),
      userId
    };

    // Store progress in KV store
    const db = getContextDB();
    const progressStore = keyValueStore(`backup_restore_progress_${backupId}`);
    await progressStore.set(db, JSON.stringify(progressData));

    console.log('Backup restore progress updated:', progressData);
  } catch (error) {
    console.error('Failed to update backup restore progress:', { 
      backupId,
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

/**
 * Handle backup restore started events
 * Initialize progress tracking in KV store
 */
const onBackupRestoreStarted: EventListener<'backup.restore.started'> = async ({ 
  backupId, 
  includeUsers, 
  userId 
}) => {
  try {
    const initialProgress = {
      backupId,
      phase: 'starting' as const,
      current: 0,
      total: 100,
      percentage: 0,
      message: 'Backup restore started',
      startedAt: new Date().toISOString(),
      includeUsers,
      userId
    };

    const db = getContextDB();
    const progressStore = keyValueStore(`backup_restore_progress_${backupId}`);
    await progressStore.set(db, JSON.stringify(initialProgress));

    console.log('Backup restore progress initialized:', initialProgress);
  } catch (error) {
    console.error('Failed to initialize backup restore progress:', error);
  }
};

/**
 * Handle backup restore completed events
 * Clean up and finalize progress in KV store
 */
const onBackupRestoreCompleted: EventListener<'backup.restore.completed'> = async ({ 
  backupId, 
  includeUsers, 
  duration, 
  userId 
}) => {
  try {
    const completedProgress = {
      backupId,
      phase: 'completed' as const,
      current: 100,
      total: 100,
      percentage: 100,
      message: 'Backup restore completed successfully',
      completedAt: new Date().toISOString(),
      duration,
      includeUsers,
      userId
    };

    const db = getContextDB();
    const progressStore = keyValueStore(`backup_restore_progress_${backupId}`);
    await progressStore.set(db, JSON.stringify(completedProgress));

    console.log('Backup restore completed:', completedProgress);
  } catch (error) {
    console.error('Failed to finalize backup restore progress:', error);
  }
};

/**
 * Handle backup restore failed events
 * Update progress with error information
 */
const onBackupRestoreFailed: EventListener<'backup.restore.failed'> = async ({ 
  backupId, 
  includeUsers, 
  error, 
  userId 
}) => {
  try {
    const failedProgress = {
      backupId,
      phase: 'failed' as const,
      current: 0,
      total: 100,
      percentage: 0,
      message: `Backup restore failed: ${error}`,
      failedAt: new Date().toISOString(),
      error,
      includeUsers,
      userId
    };

    const db = getContextDB();
    const progressStore = keyValueStore(`backup_restore_progress_${backupId}`);
    await progressStore.set(db, JSON.stringify(failedProgress));

    console.log('Backup restore failed:', failedProgress);
  } catch (kvError) {
    console.error('Failed to update backup restore progress with error:', kvError);
  }
};

/**
 * Initialize all event listeners
 * 
 * This function should be called during application startup to register
 * all the event listeners with the event emitter.
 */
export function initializeEventCallbacks(): void {
  try {
    const eventEmitter = getContextEventEmitter();
    
    // Register backup restore event handlers
    eventEmitter.on('backup.restore.triggered', onBackupRestoreTriggered);
    eventEmitter.on('backup.restore.progress', onBackupRestoreProgress);
    eventEmitter.on('backup.restore.started', onBackupRestoreStarted);
    eventEmitter.on('backup.restore.completed', onBackupRestoreCompleted);
    eventEmitter.on('backup.restore.failed', onBackupRestoreFailed);
    
    console.log('Event callbacks initialized successfully');
  } catch (error) {
    console.error('Failed to initialize event callbacks:', error);
    throw error;
  }
}

/**
 * Clear any in-progress backup restore progress on application restart
 * This should be called during application initialization
 */
export async function clearInProgressBackupRestores(): Promise<void> {
  try {
    const db = getContextDB();
    
    // Get all KV store keys that match backup restore progress pattern
    const progressEntries = await dbExecuteLogger(
      db.select()
        .from(keyValueTable)
        .where(like(keyValueTable.key, 'backup_restore_progress_%')),
      'Clear In-Progress Backup Restores - Get Progress Entries'
    );

    for (const entry of progressEntries) {
      try {
        const progressData = JSON.parse(entry.value);
        
        // Only clear if the restore is in progress (not completed or failed)
        if (progressData.phase && 
            !['completed', 'failed', 'cancelled'].includes(progressData.phase)) {
          
          const clearedProgress = {
            ...progressData,
            phase: 'cancelled' as const,
            message: 'Backup restore cancelled due to application restart',
            cancelledAt: new Date().toISOString()
          };

          const progressStore = keyValueStore(entry.key);
          await progressStore.set(db, JSON.stringify(clearedProgress));

          console.log('Cleared in-progress backup restore:', entry.key);
        }
      } catch (parseError) {
        console.error('Failed to parse progress data for key:', entry.key, parseError);
        
        // Remove invalid progress data
        await dbExecuteLogger(
          db.delete(keyValueTable).where(eq(keyValueTable.key, entry.key)),
          'Clear In-Progress Backup Restores - Delete Invalid Entry'
        );
      }
    }

    console.log('Backup restore progress cleanup completed');
  } catch (error) {
    console.error('Failed to clear in-progress backup restores:', error);
  }
}

/**
 * Get a count of registered event listeners
 * 
 * Useful for debugging and monitoring the event system
 */
export function getEventListenerCounts(): Record<string, number> {
  try {
    const eventEmitter = getContextEventEmitter();
    const events = eventEmitter.eventNames();
    
    const counts: Record<string, number> = {};
    for (const eventName of events) {
      counts[eventName] = eventEmitter.listenerCount(eventName);
    }
    
    return counts;
  } catch (error) {
    console.error('Failed to get event listener counts:', error);
    return {};
  }
}