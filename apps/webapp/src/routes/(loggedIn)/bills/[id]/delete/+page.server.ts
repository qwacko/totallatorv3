import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import { idSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo } from "$lib/routes.server";

export const load = async (data) => {
  authGuard(data);
  const pageInfo = serverPageInfo(data.route.id, data);

  if (!pageInfo.current.params?.id) redirect(302, "/bills");

  const bill = await tActions.bill.getById(pageInfo.current.params?.id);
  if (!bill) redirect(302, "/bills");

  return {
    bill,
  };
};

export const actions = {
  default: async ({ params, locals }) => {
    try {
      await tActions.bill.delete(idSchema.parse(params));
    } catch (e) {
      locals.global.logger.error("Delete Bill Error", e);
      return {};
    }
    redirect(302, "/bills");
  },
};

export const _routeConfig = {
  paramsValidation: z.object({ id: z.string() }),
} satisfies SingleServerRouteConfig;
