# Event Emitter System

This folder contains event callback registration and backup-restore progress helpers for Totallator.

From outside this package, these helpers are exposed through:

```ts
import { tHelpers } from '@totallator/business-logic';

tHelpers.events.initializeEventCallbacks();
```

## Architecture

- **Event Emitter**: Located in `@totallator/context` package as part of the global context
- **Event Callbacks**: Located in `@totallator/business-logic` package
- **Public Runtime Access**: `tHelpers.events`

## Setup

The event system is automatically initialized when the application starts:

1. Event emitter is created as part of the global context
2. Event callbacks are registered during application initialization
3. Events can be emitted from anywhere within the application context

## Adding Your First Event

### 1. Define the Event Type

Add your event to the `AppEvents` interface in `packages/context/src/eventEmitter.ts`:

```typescript
export interface AppEvents {
	'user.created': { userId: string; email: string };
	'order.completed': { orderId: string; amount: number; userId: string };
}
```

### 2. Create Event Handler

Add a handler function in `packages@totallator/business-logic/src/events/eventCallbacks.ts`:

```typescript
import { type EventListener } from '@totallator/context';

const onUserCreated: EventListener<'user.created'> = async ({ userId, email }) => {
	// Your business logic here
	console.log('User created:', { userId, email });
	// Example: Send welcome email, create user profile, etc.
};
```

### 3. Register the Handler

Add the handler to `initializeEventCallbacks()` function:

```typescript
export function initializeEventCallbacks(): void {
	try {
		const eventEmitter = getEventEmitter();

		eventEmitter.on('user.created', onUserCreated);

		console.log('Event callbacks initialized successfully');
	} catch (error) {
		console.error('Failed to initialize event callbacks:', error);
		throw error;
	}
}
```

### 4. Emit Events

From business-logic internals, emit events through the package's internal event helpers and callbacks. External application code should usually interact with the initialized event system rather than importing event internals directly.

## Public Helpers

- `tHelpers.events.initializeEventCallbacks()`
- `tHelpers.events.getEventListenerCounts()`
- `tHelpers.events.clearInProgressBackupRestores()`
- `tHelpers.events.getBackupRestoreProgress()`
- `tHelpers.events.hasActiveBackupRestore()`

## Error Handling

Event emission failures are automatically logged but don't affect the main business logic flow. The system is designed to be resilient - if event emission fails, your main operations continue normally.

## Benefits

1. **Non-blocking**: Events are emitted asynchronously using `process.nextTick()`
2. **Type-safe**: All events and payloads are strongly typed
3. **Resilient**: Event failures don't break main logic
4. **Decoupled**: Business logic doesn't need to know about event handlers
5. **Extensible**: Easy to add new events and handlers
6. **Context-aware**: Automatically uses the application context
