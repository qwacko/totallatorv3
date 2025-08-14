import { getContextEventEmitter, type EventListener } from '@totallator/context';
import { backupActions } from '../actions/backupActions.js';

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
 * Initialize all event listeners
 * 
 * This function should be called during application startup to register
 * all the event listeners with the event emitter.
 */
export function initializeEventCallbacks(): void {
  try {
    const eventEmitter = getContextEventEmitter();
    
    // Register backup restore event handler
    eventEmitter.on('backup.restore.triggered', onBackupRestoreTriggered);
    
    console.log('Event callbacks initialized successfully');
  } catch (error) {
    console.error('Failed to initialize event callbacks:', error);
    throw error;
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