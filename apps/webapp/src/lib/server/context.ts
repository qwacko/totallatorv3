import path from "path";
import { fileURLToPath } from "url";

import { materializedViewActions } from "@totallator/business-logic";
import {
  type GlobalContext,
  initializeDatabaseLogging,
  initializeGlobalContext,
} from "@totallator/context";

import { building } from "$app/environment";

import { getServerEnv } from "./serverEnv.js";

// Global context will be initialized in the init function
let globalContext: GlobalContext;

let initPromise: Promise<void> | null = null;

export const ensureInitialized = async (): Promise<GlobalContext> => {
  if (globalContext) {
    return globalContext;
  }

  if (!initPromise) {
    initPromise = initializeServer();
  }

  await initPromise;
  return globalContext;
};

export const getDb = () => {
  if (!globalContext?.db) {
    throw new Error(
      "Database not initialized. Call ensureInitialized() first.",
    );
  }
  return globalContext.db;
};

export const initializeServer = async (): Promise<void> => {
  if (building) {
    return;
  }

  await initializeDatabaseLogging({
    authToken: getServerEnv().LOG_DATABASE_KEY,
    url: getServerEnv().LOG_DATABASE_ADDRESS,
  });

  console.log("Server Init Function");
  console.log("postgresUrl:", getServerEnv().POSTGRES_URL);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const migrationsPath = path.join(
    __dirname,
    "../../../../../packages/database/src/migrations",
  );

  // Initialize global context
  globalContext = initializeGlobalContext({
    serverEnv: getServerEnv(),
    isBuilding: building,
    viewRefreshAction: async () => {
      return await materializedViewActions.conditionalRefreshWithContext({});
    },
    migrationsPath,
  });

  globalContext
    .logger("database")
    .info({ title: "Context initialization complete", code: "DB_006" });
};
