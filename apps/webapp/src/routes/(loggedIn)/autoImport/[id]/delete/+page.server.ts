import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";

import { tActions } from "@totallator/business-logic";
import { idSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { urlGenerator } from "$lib/routes";
import { serverPageInfo } from "$lib/routes.server";

export const load = async (request) => {
  authGuard(request);
  const { current } = serverPageInfo(request.route.id, request);

  if (!current.params || !current.params.id) {
    redirect(
      302,
      urlGenerator({ address: "/(loggedIn)/autoImport", searchParamsValue: {} })
        .url,
    );
  }

  const autoImportDetail = await tActions.autoImport.getById({
    id: current.params.id,
  });

  if (!autoImportDetail) {
    redirect(
      302,
      urlGenerator({ address: "/(loggedIn)/autoImport", searchParamsValue: {} })
        .url,
    );
  }

  return {
    autoImportDetail,
    id: current.params.id,
  };
};

export const actions = {
  default: async (request) => {
    const id = request.params.id;

    try {
      await tActions.autoImport.delete({
        id,
      });
    } catch (error) {
      console.error("Error deleting autoImport", error);

      return;
    }

    return redirect(
      302,
      urlGenerator({ address: "/(loggedIn)/autoImport", searchParamsValue: {} })
        .url,
    );
  },
};

export const _routeConfig = {
  paramsValidation: idSchema,
} satisfies SingleServerRouteConfig;
