import { EventEmitter } from 'events';
import pino from 'pino';

/**
 * Event definitions interface for type safety
 * Add new events here with their payload types
 *
 * Example:
 * 'user.created': { userId: string; email: string };
 * 'order.completed': { orderId: string; amount: number; userId: string };
 */
export interface AppEvents {
	// Backup restore events
	'backup.restore.triggered': {
		backupId: string;
		includeUsers: boolean;
		userId?: string;
	};
	'backup.restore.started': {
		backupId: string;
		includeUsers: boolean;
		userId?: string;
	};
	'backup.restore.completed': {
		backupId: string;
		includeUsers: boolean;
		duration: number;
		userId?: string;
	};
	'backup.restore.failed': {
		backupId: string;
		includeUsers: boolean;
		error: string;
		userId?: string;
	};

	// Backup restore progress events
	'backup.restore.progress': {
		backupId: string;
		phase: 'retrieving' | 'pre-backup' | 'deleting' | 'restoring';
		current: number;
		total: number;
		message?: string;
		userId?: string;
	};
}

/**
 * Type-safe event listener function
 */
export type EventListener<T extends keyof AppEvents> = (
	payload: AppEvents[T]
) => void | Promise<void>;

/**
 * Typed event emitter for the application
 *
 * This provides a type-safe way to emit and listen to events throughout the application.
 * Events are processed asynchronously and won't block the main execution flow.
 */
export class TypedEventEmitter {
	private emitter: EventEmitter;
	private logger: pino.Logger;

	constructor(logger: pino.Logger) {
		this.emitter = new EventEmitter();
		this.logger = logger;

		// Set max listeners to handle multiple subscribers
		this.emitter.setMaxListeners(50);

		// Handle any unhandled errors in event listeners
		this.emitter.on('error', (error) => {
			this.logger.error({ error: error.message, stack: error.stack }, 'Event emitter error');
		});
	}

	/**
	 * Emit an event with type-safe payload
	 *
	 * @param eventName - The event name (type-safe)
	 * @param payload - The event payload (type-safe based on event name)
	 */
	emit<T extends keyof AppEvents>(eventName: T, payload: AppEvents[T]): void {
		try {
			this.logger.debug({ eventName, payload }, 'Event emitted');

			// Emit asynchronously to avoid blocking
			process.nextTick(() => {
				this.emitter.emit(eventName as string, payload);
			});
		} catch (error) {
			this.logger.error(
				{
					eventName,
					payload,
					error: error instanceof Error ? error.message : String(error)
				},
				'Failed to emit event'
			);
		}
	}

	/**
	 * Listen for an event with type-safe listener
	 *
	 * @param eventName - The event name (type-safe)
	 * @param listener - The event listener function (type-safe based on event name)
	 */
	on<T extends keyof AppEvents>(eventName: T, listener: EventListener<T>): void {
		const wrappedListener = async (payload: AppEvents[T]) => {
			try {
				this.logger.debug({ eventName, payload }, 'Event listener triggered');
				await listener(payload);
			} catch (error) {
				this.logger.error(
					{
						eventName,
						payload,
						error: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined
					},
					'Event listener error'
				);
			}
		};

		this.emitter.on(eventName as string, wrappedListener);
	}

	/**
	 * Listen for an event once with type-safe listener
	 *
	 * @param eventName - The event name (type-safe)
	 * @param listener - The event listener function (type-safe based on event name)
	 */
	once<T extends keyof AppEvents>(eventName: T, listener: EventListener<T>): void {
		const wrappedListener = async (payload: AppEvents[T]) => {
			try {
				this.logger.debug({ eventName, payload }, 'One-time event listener triggered');
				await listener(payload);
			} catch (error) {
				this.logger.error(
					{
						eventName,
						payload,
						error: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined
					},
					'One-time event listener error'
				);
			}
		};

		this.emitter.once(eventName as string, wrappedListener);
	}

	/**
	 * Remove a specific listener for an event
	 *
	 * @param eventName - The event name (type-safe)
	 * @param listener - The event listener function to remove
	 */
	off<T extends keyof AppEvents>(eventName: T, listener: EventListener<T>): void {
		this.emitter.off(eventName as string, listener);
	}

	/**
	 * Remove all listeners for an event, or all listeners if no event specified
	 *
	 * @param eventName - Optional event name to remove listeners for
	 */
	removeAllListeners<T extends keyof AppEvents>(eventName?: T): void {
		if (eventName) {
			this.emitter.removeAllListeners(eventName as string);
		} else {
			this.emitter.removeAllListeners();
		}
	}

	/**
	 * Get the number of listeners for an event
	 *
	 * @param eventName - The event name
	 * @returns The number of listeners
	 */
	listenerCount<T extends keyof AppEvents>(eventName: T): number {
		return this.emitter.listenerCount(eventName as string);
	}

	/**
	 * Get all event names that have listeners
	 *
	 * @returns Array of event names
	 */
	eventNames(): (keyof AppEvents)[] {
		return this.emitter.eventNames() as (keyof AppEvents)[];
	}
}

/**
 * Create a new typed event emitter instance
 *
 * @param logger - Pino logger instance for error handling and debugging
 * @returns New TypedEventEmitter instance
 */
export function createEventEmitter(logger: pino.Logger): TypedEventEmitter {
	return new TypedEventEmitter(logger);
}
