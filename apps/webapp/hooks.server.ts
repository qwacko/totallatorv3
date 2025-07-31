import { type Handle, redirect, type ServerInit } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

// Import app types to ensure they're available
import type {} from "./src/app.js";

import { 
  initializeGlobalContext, 
  createRequestContext,
  type GlobalContext 
} from "@totallator/context";

import { building } from "$app/environment";

import { authGuard } from "./src/lib/authGuard/authGuardConfig";
import { initateCronJobs } from "./src/lib/server/cron/cron";
import { serverEnv } from "./src/lib/server/serverEnv";
import { actionHelpers, materializedViewActions, tActions } from "@totallator/business-logic";

// Global context will be initialized in the init function
let globalContext: GlobalContext;

const handleAuth: Handle = async ({ event, resolve }: Parameters<Handle>[0]) => {

  if (!globalContext) {
    throw new Error("Global context is not initialized. Please call init() before handling requests.");
  } else {
    console.log("Global context is initialized", globalContext);
  }

  if (!globalContext.db) {
    throw new Error("Database is not initialized in the global context.");
  }

  const sessionToken = event.cookies.get(tActions.auth.sessionCookieName);
  if (!sessionToken) {
    event.locals.user = undefined;
    event.locals.session = undefined;
    return resolve(event);
  }


  const { session, user } = await tActions.auth.validateSessionToken(globalContext.db, sessionToken);
  if (session !== null) {
    tActions.auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
  } else {
    tActions.auth.deleteSessionTokenCookie(event);
  }

  event.locals.user = user || undefined;
  event.locals.session = session || undefined;
  return resolve(event);
};

export const init: ServerInit = async () => {
  // This functionality is not required if the server is being built.
  if (building) {
    return;
  }
  
  console.log("Server Init Function");

  // Initialize global context
  globalContext = initializeGlobalContext({
    serverEnv,
    isBuilding: building,
    viewRefreshAction: async () => {
      return await materializedViewActions.conditionalRefreshWithContext({ global: globalContext });
    }
  });

  // Initialize cron jobs
  initateCronJobs(() => ({db: globalContext.db}));

  //Setup DB Logger
  actionHelpers.initDBLogger(globalContext.db);


  globalContext.logger.info("Server initialization complete", global.db);
};

const handleRoute: Handle = async ({ event, resolve }: Parameters<Handle>[0]) => {
  if(!globalContext) {
    throw new Error("Global context is not initialized. Please call init() before handling requests.");
  }

  if(!globalContext.db) {
    throw new Error("Database is not initialized in the global context.");
  }
  // Set up contexts in locals
  event.locals.global = globalContext;
  event.locals.request = createRequestContext(event);
  event.locals.db = globalContext.db; // Keep for backward compatibility

  const timeLimit = globalContext.serverEnv.PAGE_TIMEOUT_MS;
  const timeout = setTimeout(() => {
    globalContext.logger.warn(`Request took longer than ${timeLimit}ms to resolve`, {
      requestId: event.locals.request.requestId,
      requestURL: event.request.url
    });
  }, timeLimit);

  // Import the business logic function we need
  const { noAdmins } = await import("@totallator/business-logic");
  const noAdmin = await noAdmins({ global: globalContext });

  if (!event.route.id) {
    redirect(302, "/login");
  }

  if (event.route.id === "/(loggedOut)/firstUser" && !noAdmin) {
    globalContext.logger.info("Redirecting from firstUser");
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

  const result = await resolve(event);

  clearTimeout(timeout);

  return result;
};

export const handle = sequence(handleAuth, handleRoute);
