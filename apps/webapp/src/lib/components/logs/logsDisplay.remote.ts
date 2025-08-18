import z from "zod";

import {
  getGlobalContextFromStore,
  logConfigFilterValidation,
  logFilterValidation,
  logLevelEnum,
} from "@totallator/context";

import { form, query } from "$app/server";

export const getLogs = query(logFilterValidation, async (filter) => {
  const globalContext = getGlobalContextFromStore();
  const logs = await globalContext.logging.queryLoggedItems({
    ...filter,
    limit: 100,
  });
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

export const setLogConfiguration = form(async (data) => {
  const globalContext = getGlobalContextFromStore();
  const logLevelIn = data.get("level");
  const domain = data.get("domain");
  const action = data.get("action");
  const destination = data.get("destination");
  const adjustedForm = {
    logLevel: logLevelIn,
    domain: domain !== null ? [domain] : undefined,
    action: action !== null ? [action] : undefined,
    destination: destination !== null ? [destination] : undefined,
  };
  const validatedData = z
    .object({
      ...logConfigFilterValidation.shape,
      logLevel: z.enum(logLevelEnum),
    })
    .safeParse(adjustedForm);
  if (validatedData.error) {
    console.error("Failed to set log configuration:", validatedData.error);
    throw new Error("Invalid log configuration", validatedData.error);
  }

  const { logLevel, ...filter } = validatedData.data;
  await globalContext.logging.setLogLevel({ logLevel, filter });

  return {};
});
