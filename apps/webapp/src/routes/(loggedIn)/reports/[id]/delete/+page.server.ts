import type { SingleServerRouteConfig } from "skroutes";
import z from "zod";

import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { defaultReportRedirect } from "$lib/helpers/defaultRedirect";
import { serverPageInfo } from "$lib/routes.server";

export const _routeConfig = {
  paramsValidation: z.object({ id: z.string() }),
} satisfies SingleServerRouteConfig;

export const load = async (data) => {
  authGuard(data);
  const pageInfo = serverPageInfo(data.route.id, data);

  if (!pageInfo.current.params) return defaultReportRedirect();

  const reportInfo = await tActions.report.getSimpleReportConfig({
    id: pageInfo.current.params.id,
  });

  if (!reportInfo) return defaultReportRedirect();

  return { reportInfo };
};

export const actions = {
  default: async (data) => {
    const id = data.params.id;

    try {
      await tActions.report.delete({ id });
      defaultReportRedirect();
    } catch (e) {
      data.locals.global.logger('reports').error({code: "RPT_0004", title: "Error deleting report", error: e});
    }
  },
};
