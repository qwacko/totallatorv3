import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { serverPageInfo } from "$lib/routes.js";

export const load = async (requestData) => {
  authGuard(requestData);
  const { current: pageInfo } = serverPageInfo(
    requestData.route.id,
    requestData,
  );

  const searchParams = pageInfo.searchParams || { page: 0, pageSize: 10 };
  const data = await tActions.queryLog.listGroups({
    filter: searchParams,
  });

  return {
    data,
    searchParams,
    filterText: await tActions.queryLog.filterToText({
      filter: searchParams,
    }),
  };
};
