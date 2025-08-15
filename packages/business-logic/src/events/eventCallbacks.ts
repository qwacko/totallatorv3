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
		const db = getContextDB();
		const progressStore = keyValueStore(`backup_restore_progress_${backupId}`);

		// Get existing progress data to maintain action history
		let existingData: any = {};
		try {
			const existingJson = await progressStore.get(db);
			if (existingJson) {
				existingData = JSON.parse(existingJson);
			}
		} catch (parseError) {
			console.warn('Could not parse existing progress data, starting fresh:', parseError);
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
		const db = getContextDB();
		const progressStore = keyValueStore(`backup_restore_progress_${backupId}`);

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
		const db = getContextDB();
		const progressStore = keyValueStore(`backup_restore_progress_${backupId}`);

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
			db.select().from(keyValueTable).where(like(keyValueTable.key, 'backup_restore_progress_%')),
			'Clear In-Progress Backup Restores - Get Progress Entries'
		);

		for (const entry of progressEntries) {
			try {
				const progressData = JSON.parse(entry.value);

				// Only clear if the restore is in progress (not completed or failed)
				if (
					progressData.phase &&
					!['completed', 'failed', 'cancelled'].includes(progressData.phase)
				) {
					const cancelledTimestamp = new Date().toISOString();
					const cancelledAction = {
						timestamp: cancelledTimestamp,
						phase: 'cancelled' as const,
						current: progressData.current || 0,
						total: progressData.total || 100,
						percentage: 0,
						message: 'Backup restore cancelled due to application restart'
					};

					// Maintain action history
					const actionHistory = progressData.actionHistory || [];
					actionHistory.push(cancelledAction);

					const clearedProgress = {
						...progressData,
						phase: 'cancelled' as const,
						message: 'Backup restore cancelled due to application restart',
						cancelledAt: cancelledTimestamp,
						updatedAt: cancelledTimestamp,
						actionHistory
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
 * Get backup restore progress for a specific backup
 */
export async function getBackupRestoreProgress(backupId: string): Promise<any | null> {
	try {
		const db = getContextDB();
		const progressStore = keyValueStore(`backup_restore_progress_${backupId}`);
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
 * Get all active backup restores (in progress)
 */
export async function getActiveBackupRestores(): Promise<any[]> {
	try {
		const db = getContextDB();

		// Get all KV store keys that match backup restore progress pattern
		const progressEntries = await dbExecuteLogger(
			db.select().from(keyValueTable).where(like(keyValueTable.key, 'backup_restore_progress_%')),
			'Get Active Backup Restores'
		);

		const activeRestores: any[] = [];

		for (const entry of progressEntries) {
			try {
				const progressData = JSON.parse(entry.value);

				// Only include if the restore is in progress (not completed, failed, or cancelled)
				if (
					progressData.phase &&
					!['completed', 'failed', 'cancelled'].includes(progressData.phase)
				) {
					activeRestores.push(progressData);
				}
			} catch (parseError) {
				console.warn('Could not parse progress data for key:', entry.key, parseError);
			}
		}

		return activeRestores;
	} catch (error) {
		console.error('Failed to get active backup restores:', error);
		return [];
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
