import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";

import { tActions } from "@totallator/business-logic";
import { idSchema } from "@totallator/shared";

import { urlGenerator } from "$lib/routes";

export const actions = {
  reprocess: async ({ params, locals }) => {
    try {
      await tActions.import.reprocess({ id: params.id });
    } catch (e) {
      locals.global.logger('import').error({
        code: "IMP_0003",
        title: "Reprocess Import Error",
        error: JSON.stringify(e, null, 2)
      });
    }
  },
  triggerImport: async ({ params, locals }) =>
    tActions.import.triggerImport({ id: params.id }),
  clean: async ({ params, locals }) => {
    try {
      await tActions.import.clean({ id: params.id });
    } catch (e) {
      locals.global.logger('import').error({
        code: "IMP_0004",
        title: "Clean Import Error",
        error: JSON.stringify(e, null, 2)
      });
    }

    const importData = await tActions.import.get({
      id: params.id,
    });

    if (!importData.importInfo) {
      return redirect(
        302,
        urlGenerator({ address: "/(loggedIn)/import", searchParamsValue: {} })
          .url,
      );
    }
  },
  toggleAutoClean: async ({ params, locals }) => {
    const id = params.id;

    const importData = await tActions.import.get({ id });

    if (!importData.importInfo) {
      return;
    }

    await tActions.import.update({
      data: { id, autoClean: !importData.importInfo.import.autoClean },
    });
  },
  toggleAutoProcess: async ({ params, locals }) => {
    const id = params.id;

    const importData = await tActions.import.get({ id });

    if (!importData.importInfo) {
      return;
    }

    await tActions.import.update({
      data: { id, autoProcess: !importData.importInfo.import.autoProcess },
    });
  },
};

export const _routeConfig = {
  paramsValidation: idSchema,
} satisfies SingleServerRouteConfig;
