import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import { idSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo } from "$lib/routes.server";

export const _routeConfig = {
  paramsValidation: z.object({ id: z.string() }),
} satisfies SingleServerRouteConfig;

export const load = async (data) => {
  authGuard(data);
  const pageInfo = serverPageInfo(data.route.id, data);

  if (!pageInfo.current.params?.id) redirect(302, "/tags");

  const tag = await tActions.tag.getById(pageInfo.current.params?.id);
  if (!tag) redirect(302, "/tags");

  return {
    tag,
  };
};

export const actions = {
  default: async ({ params, locals }) => {
    try {
      await tActions.tag.delete(idSchema.parse(params));
    } catch (e) {
      locals.global.logger('tags').error({code: "TAG_0002", title: "Delete Tag Error", error: e});
      return {};
    }
    redirect(302, "/tags");
  },
};
