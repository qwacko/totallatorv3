import { type AppEvents, getEventEmitter } from '@totallator/context';

/**
 * Helper function to emit events from business logic
 *
 * This provides a convenient way to emit events without having to
 * directly access the event emitter throughout the business logic.
 */
export function emitEvent<T extends keyof AppEvents>(eventName: T, payload: AppEvents[T]): void {
	try {
		const eventEmitter = getEventEmitter();
		console.log('Emitting event:', eventName, 'with payload:', payload);
		console.log('Event emitter has listeners:', eventEmitter.listenerCount(eventName));
		eventEmitter.emit(eventName, payload);
		console.log('Event emitted successfully:', eventName);
	} catch (error) {
		// Log the error but don't throw - we don't want event emission failures
		// to break the main business logic flow
		console.error('Failed to emit event:', {
			eventName,
			payload,
			error: error instanceof Error ? error.message : String(error)
		});
	}
}

/**
 * Check if the event emitter is available in the current context
 *
 * Useful for conditional event emission when not sure if running
 * within the proper context.
 */
export function canEmitEvents(): boolean {
	try {
		getEventEmitter();
		return true;
	} catch {
		return false;
	}
}

/**
 * Emit multiple events in sequence
 *
 * Useful when a single operation should trigger multiple events.
 */
export function emitMultipleEvents<T extends keyof AppEvents>(
	events: Array<{
		name: T;
		payload: AppEvents[T];
	}>
): void {
	for (const event of events) {
		emitEvent(event.name, event.payload);
	}
}
