import { getGlobalContextFromStore } from "@totallator/context";

import { form, query } from "$app/server";

export const getLogs = query(async () => {
  const globalContext = getGlobalContextFromStore();
  const logs = await globalContext.logging.queryLoggedItems({ limit: 100 });
  return {
    logs,
  };
});

export const getLogConfigurations = query(async () => {
  const globalContext = getGlobalContextFromStore();
  const configurations =
    await globalContext.logging.logDatabaseOps.getAllLogConfigurations();
  return {
    configurations,
  };
});
