import { type Handle, redirect, type ServerInit } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

import { actionHelpers, tActions, initializeEventCallbacks, clearInProgressBackupRestores, hasActiveBackupRestore, getEventListenerCounts } from "@totallator/business-logic";
import { noAdmins } from "@totallator/business-logic";
import {
  createRequestContext,
  runRequestInTransaction,
  runWithContext,
} from "@totallator/context";

import { loadConfigServer } from "$lib/routes.server.js";

import { authGuard } from "./lib/authGuard/authGuardConfig.js";
import { ensureInitialized } from "./lib/server/context.js";
import { initializeNewCronService } from "./lib/server/cron/newCronService.js";

const handleAuth: Handle = async ({
  event,
  resolve,
}: Parameters<Handle>[0]) => {
  const context = await ensureInitialized();

  if (!context.db) {
    throw new Error("Database is not initialized in the global context.");
  }

  // Create request context for auth
  const requestContext = createRequestContext(event);

  // Run auth within AsyncLocalStorage context
  return runWithContext(context, requestContext, async () => {
    const sessionToken = event.cookies.get(tActions.auth.sessionCookieName);
    if (!sessionToken) {
      event.locals.user = undefined;
      event.locals.session = undefined;
      return resolve(event);
    }

    const { session, user } =
      await tActions.auth.validateSessionToken(sessionToken);
    if (session !== null) {
      tActions.auth.setSessionTokenCookie(
        event,
        sessionToken,
        session.expiresAt,
      );
    } else {
      tActions.auth.deleteSessionTokenCookie(event);
    }

    event.locals.user = user || undefined;
    event.locals.session = session || undefined;
    return resolve(event);
  });
};

export const init: ServerInit = async () => {
  await loadConfigServer();

  const context = await ensureInitialized();

  //Setup DB Logger
  actionHelpers.initDBLogger(context);

  // Initialize event callbacks and clear progress
  setTimeout(async () => {
    try {
      // Create a proper mock request event for initialization
      const mockEvent = {
        request: new Request('http://localhost/internal/init'),
        locals: {
          user: undefined,
          session: undefined
        },
        getClientAddress: () => '127.0.0.1'
      };
      
      // Run within the context so event callbacks can access the event emitter
      await runWithContext(context, createRequestContext(mockEvent), async () => {
        console.log('Initializing event callbacks...');
        initializeEventCallbacks();
        console.log('Event callbacks initialized');
        
        // Check if listeners are registered
        const listenerCounts = getEventListenerCounts();
        console.log('Registered event listeners:', listenerCounts);
        
        // Clear any in-progress backup restores from previous runs
        console.log('Clearing in-progress backup restores...');
        await clearInProgressBackupRestores();
        console.log('Backup restore cleanup completed');
      });
    } catch (error) {
      console.error('Failed to initialize event callbacks:', error);
    }
  }, 1500); // Delay to ensure everything is fully initialized

  // Initialize new cron service after database is ready
  // Add a small delay to ensure migrations have completed
  setTimeout(async () => {
    try {
      await initializeNewCronService(() => context);
    } catch (error) {
      console.error("Failed to initialize cron service:", error);
      // Retry after 5 seconds if it fails
      setTimeout(async () => {
        try {
          await initializeNewCronService(() => context);
        } catch (retryError) {
          console.error(
            "Failed to initialize cron service on retry:",
            retryError,
          );
        }
      }, 5000);
    }
  }, 1000);
};

const handleRoute: Handle = async ({
  event,
  resolve,
}: Parameters<Handle>[0]) => {
  const context = await ensureInitialized();

  if (!context.db) {
    throw new Error("Database is not initialized in the global context.");
  }
  // Create request context
  const requestContext = createRequestContext(event);

  // Set up contexts in locals (for backward compatibility)
  event.locals.global = context;
  event.locals.request = requestContext;
  event.locals.db = context.db; // Keep for backward compatibility

  const timeLimit = context.serverEnv.PAGE_TIMEOUT_MS;
  const timeout = setTimeout(() => {
    context.logger.warn(`Request took longer than ${timeLimit}ms to resolve`, {
      requestId: requestContext.requestId,
      requestURL: event.request.url,
    });
  }, timeLimit);

  // Run everything within AsyncLocalStorage context
  return runWithContext(context, requestContext, async () => {
    // Import the business logic function we need
    const noAdmin = await noAdmins({ global: context });

    if (!event.route.id) {
      redirect(302, "/login");
    }

    if (event.route.id === "/(loggedOut)/firstUser" && !noAdmin) {
      context.logger.info("Redirecting from firstUser");
      if (event.locals.user) {
        redirect(302, "/users");
      } else {
        redirect(302, "/login");
      }
    }

    if (event.route.id !== "/(loggedOut)/firstUser" && noAdmin) {
      redirect(302, "/firstUser");
    }

    // Check for active backup restores and redirect to progress page
    // Only check for logged-in users and skip the progress page itself
    if (event.locals.user && 
        event.route.id && 
        !event.route.id.startsWith('/(loggedOut)') &&
        !event.route.id.includes('backup-restore-progress')) {
      
      try {
        const hasActiveRestore = await hasActiveBackupRestore();
        
        if (hasActiveRestore) {
          redirect(302, '/backup-restore-progress');
        }
      } catch (error) {
        // Check if this is a redirect (which is expected behavior)
        if (error && typeof error === 'object' && 'status' in error && error.status === 302) {
          // This is a redirect, re-throw it
          throw error;
        }
        // Don't block requests if backup restore check fails
        context.logger.warn('Failed to check for active backup restore:', error);
      }
    }

    if (event.route.id) {
      authGuard(event as Parameters<typeof authGuard>[0]);
    }

    // Wrap non-GET requests in transactions
    const isNonGetRequest = event.request.method !== "GET";
    let result;

    if (isNonGetRequest) {
      context.logger.debug(
        `Wrapping ${event.request.method} request in transaction`,
        {
          requestId: requestContext.requestId,
          requestURL: event.request.url,
        },
      );

      result = await runRequestInTransaction(async () => {
        return await resolve(event);
      });
    } else {
      result = await resolve(event);
    }

    clearTimeout(timeout);

    return result;
  });
};

export const handle = sequence(handleAuth, handleRoute);
