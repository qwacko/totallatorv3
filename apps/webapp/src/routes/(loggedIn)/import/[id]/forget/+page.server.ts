import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";

import { tActions } from "@totallator/business-logic";
import { idSchema } from "@totallator/shared";

import { urlGenerator } from "$lib/routes";

export const actions = {
  default: async ({ params, locals }) => {
    let deleted = false;
    try {
      await tActions.import.forgetImport({ id: params.id });
      deleted = true;
    } catch (e) {
      locals.global.logger.error(
        "Import Forget Error",
        JSON.stringify(e, null, 2),
      );
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
