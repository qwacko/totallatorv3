# @totallator/context

Application context management for the Totallator application using AsyncLocalStorage for request-scoped context.

## Overview

This package provides centralized context management including:

- **Global Context**: Application-wide resources (database, logger, configuration)
- **Request Context**: Request-scoped data (user authentication, request metadata)
- **Transaction Management**: Database transaction handling with automatic context preservation
- **AsyncLocalStorage Integration**: Seamless context access throughout the request lifecycle

## Core API

### Global Context

```typescript
import { initializeGlobalContext } from '@totallator/context';

// Initialize once during app startup
const globalContext = initializeGlobalContext({
	serverEnv: getServerEnv(),
	migrationsPath: './migrations',
	viewRefreshAction: async () => refreshMaterializedViews()
});
```

### Request Context

```typescript
import { createRequestContext, runWithContext } from "@totallator/context";

// Create request context from SvelteKit event
const requestContext = createRequestContext(event);

// Run request within context
return runWithContext(globalContext, requestContext, async () => {
  // Request handling logic
});
```

### Database Access

```typescript
import { getContextDB } from '@totallator/context';

// Get database (automatically uses transaction DB if available)
const db = getContextDB();
const users = await db.select().from(usersTable);
```

### Transaction Management

```typescript
import { runInTransactionWithLogging } from '@totallator/context';

// Recommended way to run transactions
const result = await runInTransactionWithLogging('UpdateUserProfile', async (txDb) => {
	// All database operations use transaction automatically
	await updateUser(userId, userData);
	await logUserActivity(userId, 'profile_updated');
	return { success: true };
});
```

### Request-Level Transactions

```typescript
import { runRequestInTransaction } from "@totallator/context";

// Wrap entire request in transaction (for non-GET requests)
return await runRequestInTransaction(async () => {
  // All database operations in this request use the same transaction
  return await handleFormSubmission(formData);
});
```

## Architecture

### Context Flow

1. **App Startup**: `initializeGlobalContext()` creates global resources
2. **Request Start**: `createRequestContext()` extracts request data
3. **Request Processing**: `runWithContext()` establishes AsyncLocalStorage context
4. **Business Logic**: `getContextDB()` provides database access
5. **Transactions**: `runInTransactionWithLogging()` for transactional operations

### AsyncLocalStorage Structure

```typescript
// Standard context (most requests)
{
  global: GlobalContext,    // App-wide resources
  request: RequestContext   // Request-specific data
}

// Transaction context (when in transaction)
{
  global: GlobalContext,
  request: RequestContext,
  transactionDb: TransactionType  // Transaction-scoped DB
}
```

## Key Features

- **Automatic Context Management**: No manual context passing required
- **Transaction Integration**: Transparent transaction support with context preservation
- **Performance Logging**: Configurable transaction timing and logging
- **Type Safety**: Full TypeScript support with strict typing
- **Error Handling**: Comprehensive error reporting with context information

## Simplified API

This package has been refactored to provide a clean, minimal API:

- **12 core exports** (down from 60+)
- **No unused utility functions**
- **Comprehensive documentation**
- **Clear separation of concerns**

## Integration

The context package integrates seamlessly with:

- **SvelteKit**: Request handling and server-side operations
- **Drizzle ORM**: Database operations and transactions
- **Business Logic**: Actions and server-side functions
- **Logging**: Application-wide logging with context information
