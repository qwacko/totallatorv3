/**
 * Event system for business logic
 * 
 * This module provides:
 * - Event callbacks that handle business logic when events occur
 * - Helper functions to emit events from business logic operations
 * - Initialization functions to set up the event system
 */

export { initializeEventCallbacks, getEventListenerCounts } from './eventCallbacks.js';
export { emitEvent, canEmitEvents, emitMultipleEvents } from './eventHelper.js';