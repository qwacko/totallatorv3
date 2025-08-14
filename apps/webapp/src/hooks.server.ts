import { type Handle, redirect, type ServerInit } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

import { actionHelpers, tActions } from "@totallator/business-logic";
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
