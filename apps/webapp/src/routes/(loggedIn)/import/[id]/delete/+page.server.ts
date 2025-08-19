import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";

import { tActions } from "@totallator/business-logic";
import { idSchema } from "@totallator/shared";

import { urlGenerator } from "$lib/routes";

export const load = async (data) => {
  const parentData = await data.parent();

  const canDelete = parentData.canDelete;

  if (!canDelete) {
    redirect(
      302,
      urlGenerator({
        address: "/(loggedIn)/import/[id]",
        paramsValue: { id: data.params.id },
      }).url,
    );
  }
};

export const actions = {
  default: async ({ params, locals }) => {
    let deleted = false;
    try {
      await tActions.import.delete({ id: params.id });
      deleted = true;
    } catch (e) {
      locals.global.logger('import').error({
        code: "IMP_0002",
        title: "Import Delete Error",
        error: JSON.stringify(e, null, 2)
      });
    }

    if (deleted) {
      redirect(
        302,
        urlGenerator({ address: "/(loggedIn)/import", searchParamsValue: {} })
          .url,
      );
    }
  },
};

export const _routeConfig = {
  paramsValidation: idSchema,
} satisfies SingleServerRouteConfig;
