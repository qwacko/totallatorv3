import { getContextEventEmitter } from '@totallator/context';

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
 * Initialize all event listeners
 * 
 * This function should be called during application startup to register
 * all the event listeners with the event emitter.
 */
export function initializeEventCallbacks(): void {
  try {
    // Get the event emitter for when you need to register listeners
    // const eventEmitter = getContextEventEmitter();
    
    // Add your event listeners here
    // Example:
    // eventEmitter.on('user.created', onUserCreated);
    // eventEmitter.on('order.completed', onOrderCompleted);
    
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