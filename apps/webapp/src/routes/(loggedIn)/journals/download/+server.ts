import type { ServerRouteConfig } from "skroutes";
import z from "zod";

import { tActions } from "@totallator/business-logic";
import {
  defaultJournalFilter,
  downloadTypeSchema,
  journalFilterSchema,
} from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { serverPageInfo } from "$lib/routes.server.js";

export const _routeConfig = {
  searchParamsValidation: z
    .object({ ...journalFilterSchema.shape, ...downloadTypeSchema.shape })
    .optional()
    .catch(defaultJournalFilter()),
} satisfies ServerRouteConfig[string];

export const GET = async (data) => {
  authGuard(data);
  const {
    current: { searchParams },
  } = serverPageInfo(data.route.id, data);

  const csvData = await tActions.journalView.generateCSVData({
    filter: searchParams,
    returnType: searchParams?.downloadType || "default",
  });

  const dateText = new Date().toISOString().slice(0, 19);

  return new Response(csvData, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=${dateText}-journalExport.csv`,
    },
  });
};
