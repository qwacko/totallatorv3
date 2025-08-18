import { queryLoggedItems } from "@totallator/context";

import { query } from "$app/server";

export const getLogs = query(async () => {
  console.log("Getting Logs");
  const logs = await queryLoggedItems({ limit: 100 });
  console.log("Logs:", logs);
  return {
    logs,
  };
});
