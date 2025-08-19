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

  if (!pageInfo.current.params?.id) redirect(302, "/accounts");

  const account = await tActions.account.getById(pageInfo.current.params?.id);
  if (!account) redirect(302, "/accounts");

  return {
    account,
  };
};

export const actions = {
  default: async ({ params, locals }) => {
    try {
      await tActions.account.delete(idSchema.parse(params));
    } catch (e) {
      locals.global.logger('accounts').error({code: "ACC_0003", title: "Delete Account Error", error: e});
      return {};
    }
    redirect(302, "/accounts");
  },
};

export const _routeConfig = {
  paramsValidation: z.object({ id: z.string() }),
} satisfies SingleServerRouteConfig;
