

import { 
  initializeGlobalContext,
  type GlobalContext 
} from "@totallator/context";

import { building } from "$app/environment";

import { getServerEnv } from "./serverEnv.js";
import { materializedViewActions,  } from "@totallator/business-logic";

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

export const initializeServer = async (): Promise<void> => {
  if (building) {
    return;
  }
  
  console.log("Server Init Function");
  console.log("postgresUrl:", getServerEnv().POSTGRES_URL);

  // Initialize global context
  globalContext = initializeGlobalContext({
    serverEnv : getServerEnv(),
    isBuilding: building,
    viewRefreshAction: async () => {
      return await materializedViewActions.conditionalRefreshWithContext({ global: globalContext });
    }
  });

  

  globalContext.logger.info("Context initialization complete");
};
