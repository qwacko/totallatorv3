import { getContextEventEmitter, type EventListener, getGlobalContextFromStore } from '@totallator/context';
import { backupActions } from '../actions/backupActions.js';
import { keyValueStore } from '../actions/helpers/keyValueStore.js';
import { keyValueTable } from '@totallator/database';
import { eq } from 'drizzle-orm';
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
		const globalContext = getGlobalContextFromStore();
		if (!globalContext) {
			throw new Error('Global context not available');
		}
		const db = globalContext.db;
		const progressStore = keyValueStore('backup_restore_progress');

		// Get existing progress data to maintain action history
		let existingData: any = {};
		try {
			const existingJson = await progressStore.get(db);
			if (existingJson) {
				existingData = JSON.parse(existingJson);
			}
		} catch (parseError) {
			console.warn('Could not get/parse existing progress data, starting fresh:', parseError);
		}

		// Create new action entry
		const actionEntry = {
			timestamp: new Date().toISOString(),
			phase,
			current,
			total,
			percentage: Math.round((current / total) * 100),
			message: message || ''
		};

		// Maintain action history array
		const actionHistory = existingData.actionHistory || [];
		actionHistory.push(actionEntry);

		const progressData = {
			backupId,
			phase,
			current,
			total,
			percentage: Math.round((current / total) * 100),
			message: message || '',
			updatedAt: new Date().toISOString(),
			userId,
			actionHistory,
			startedAt: existingData.startedAt || new Date().toISOString()
		};

		// Store progress in KV store
		await progressStore.set(db, JSON.stringify(progressData));

		console.log('Backup restore progress updated:', {
			backupId: progressData.backupId,
			phase: progressData.phase,
			current: progressData.current,
			total: progressData.total,
			percentage: progressData.percentage
		});
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
		console.log('On Backup Restore Stared FUnction...');
		const startTimestamp = new Date().toISOString();
		const initialAction = {
			timestamp: startTimestamp,
			phase: 'starting' as const,
			current: 0,
			total: 100,
			percentage: 0,
			message: 'Backup restore started'
		};

		const initialProgress = {
			backupId,
			phase: 'starting' as const,
			current: 0,
			total: 100,
			percentage: 0,
			message: 'Backup restore started',
			startedAt: startTimestamp,
			updatedAt: startTimestamp,
			includeUsers,
			userId,
			actionHistory: [initialAction]
		};

		const globalContext = getGlobalContextFromStore();
		if (!globalContext) {
			throw new Error('Global context not available');
		}
		const db = globalContext.db;
		const progressStore = keyValueStore('backup_restore_progress');
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
		const globalContext = getGlobalContextFromStore();
		if (!globalContext) {
			throw new Error('Global context not available');
		}
		const db = globalContext.db;
		const progressStore = keyValueStore('backup_restore_progress');

		// Get existing data to maintain action history
		let existingData: any = {};
		try {
			const existingJson = await progressStore.get(db);
			if (existingJson) {
				existingData = JSON.parse(existingJson);
			}
		} catch (parseError) {
			console.warn('Could not parse existing progress data for completion:', parseError);
		}

		const completedTimestamp = new Date().toISOString();
		const completedAction = {
			timestamp: completedTimestamp,
			phase: 'completed' as const,
			current: 100,
			total: 100,
			percentage: 100,
			message: 'Backup restore completed successfully'
		};

		// Maintain action history
		const actionHistory = existingData.actionHistory || [];
		actionHistory.push(completedAction);

		const completedProgress = {
			backupId,
			phase: 'completed' as const,
			current: 100,
			total: 100,
			percentage: 100,
			message: 'Backup restore completed successfully',
			completedAt: completedTimestamp,
			updatedAt: completedTimestamp,
			duration,
			includeUsers,
			userId,
			actionHistory,
			startedAt: existingData.startedAt || completedTimestamp
		};

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
		const globalContext = getGlobalContextFromStore();
		if (!globalContext) {
			throw new Error('Global context not available');
		}
		const db = globalContext.db;
		const progressStore = keyValueStore('backup_restore_progress');

		// Get existing data to maintain action history
		let existingData: any = {};
		try {
			const existingJson = await progressStore.get(db);
			if (existingJson) {
				existingData = JSON.parse(existingJson);
			}
		} catch (parseError) {
			console.warn('Could not parse existing progress data for failure:', parseError);
		}

		const failedTimestamp = new Date().toISOString();
		const failedAction = {
			timestamp: failedTimestamp,
			phase: 'failed' as const,
			current: existingData.current || 0,
			total: existingData.total || 100,
			percentage: 0,
			message: `Backup restore failed: ${error}`
		};

		// Maintain action history
		const actionHistory = existingData.actionHistory || [];
		actionHistory.push(failedAction);

		const failedProgress = {
			backupId,
			phase: 'failed' as const,
			current: existingData.current || 0,
			total: existingData.total || 100,
			percentage: 0,
			message: `Backup restore failed: ${error}`,
			failedAt: failedTimestamp,
			updatedAt: failedTimestamp,
			error,
			includeUsers,
			userId,
			actionHistory,
			startedAt: existingData.startedAt || failedTimestamp
		};

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
		console.log('Initializing event callbacks...');

		const eventEmitter = getContextEventEmitter();

		// Clear any existing listeners to prevent duplicates (important for HMR in dev mode)
		eventEmitter.removeAllListeners('backup.restore.triggered');
		eventEmitter.removeAllListeners('backup.restore.progress');
		eventEmitter.removeAllListeners('backup.restore.started');
		eventEmitter.removeAllListeners('backup.restore.completed');
		eventEmitter.removeAllListeners('backup.restore.failed');

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
		const globalContext = getGlobalContextFromStore();
		if (!globalContext) {
			throw new Error('Global context not available');
		}
		const db = globalContext.db;

		// Delete the backup restore progress entry from the database
		await dbExecuteLogger(
			db.delete(keyValueTable).where(eq(keyValueTable.key, 'backup_restore_progress')),
			'Clear Backup Restore Progress'
		);

		console.log('Backup restore progress cleared on application restart');
	} catch (error) {
		console.error('Failed to clear backup restore progress:', error);
	}
}

/**
 * Get current backup restore progress
 */
export async function getBackupRestoreProgress(): Promise<any | null> {
	try {
		const globalContext = getGlobalContextFromStore();
		if (!globalContext) {
			throw new Error('Global context not available');
		}
		const db = globalContext.db;
		const progressStore = keyValueStore('backup_restore_progress');
		const progressJson = await progressStore.get(db);

		if (!progressJson) {
			return null;
		}

		return JSON.parse(progressJson);
	} catch (error) {
		console.error('Failed to get backup restore progress:', error);
		return null;
	}
}

/**
 * Check if there's an active backup restore in progress
 */
export async function hasActiveBackupRestore(): Promise<boolean> {
	try {
		const progress = await getBackupRestoreProgress();

		if (!progress || !progress.phase) {
			return false;
		}

		// Check if the restore is in progress (not completed, failed, or cancelled)
		return !['completed', 'failed', 'cancelled'].includes(progress.phase);
	} catch (error) {
		console.error('Failed to check for active backup restore:', error);
		return false;
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
