import type { SingleServerRouteConfig } from "skroutes";

import { tActions } from "@totallator/business-logic";
import { queryLogFilterSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { serverPageInfo } from "$lib/routes.server.js";

export const _routeConfig = {
  searchParamsValidation: queryLogFilterSchema.optional().catch({}),
} satisfies SingleServerRouteConfig;

export const load = async (requestData) => {
  authGuard(requestData);
  const { current: pageInfo } = serverPageInfo(
    requestData.route.id,
    requestData,
  );

  const searchParams = pageInfo.searchParams || { page: 0, pageSize: 10 };
  const data = await tActions.queryLog.list({
    filter: searchParams,
  });

  return {
    data,
    searchParams,
    filterText: await tActions.queryLog.filterToText({
      filter: searchParams,
    }),
    xyData: tActions.queryLog.listXY({
      filter: searchParams,
    }),
  };
};
