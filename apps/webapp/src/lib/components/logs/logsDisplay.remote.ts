import z from "zod";

import { getContext } from "@totallator/context";
import {
  logConfigFilterValidation,
  logFilterValidation,
  logLevelEnum,
} from "@totallator/shared";

import { form, query } from "$app/server";

export const getLogs = query(
  z.object({
    ...logFilterValidation.shape,
    limit: z.number().min(0).optional().default(100),
    offset: z.number().min(0).optional().default(0),
  }),
  async (filter) => {
    const globalContext = getContext();
    const logs = await globalContext.global.logging.queryLoggedItems(filter);
    const logCount =
      await globalContext.global.logging.getLoggedItemsCount(filter);
    return {
      logs,
      logCount,
    };
  },
);

export const getLogConfigurations = query(async () => {
  const globalContext = getContext();
  const configurations =
    await globalContext.global.logging.getAllLogConfigurations();
  return {
    configurations,
  };
});

export const setLogConfiguration = form(async (data) => {
  const globalContext = getContext();
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
  await globalContext.global.logging.setLogLevel({ logLevel, filter });

  return {};
});
