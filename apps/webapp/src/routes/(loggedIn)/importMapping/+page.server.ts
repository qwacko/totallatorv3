import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";

import { importMappingFilterToText } from "@totallator/business-logic";
import { tActions } from "@totallator/business-logic";
import { importMappingFilterSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo } from "$lib/routes.server";

export const load = async (data) => {
  authGuard(data);
  const db = data.locals.db;
  const { current, updateParams } = serverPageInfo(data.route.id, data);

  const importMappings = await tActions.importMapping.list({
    filter: current.searchParams || {},
  });

  const redirectRequired = importMappings.page >= importMappings.pageCount;
  if (redirectRequired) {
    const targetPage = Math.max(0, importMappings.pageCount - 1);
    redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
  }

  const filterText = await importMappingFilterToText(
    db,
    current.searchParams || {},
  );

  return {
    importMappings,
    filterText,
    searchParams: current.searchParams,
  };
};

export const actions = {
  default: async (data) => {
    const form = await data.request.formData();
    const importMappingId = form.get("importMappingId")?.toString();
    const action = form.get("action")?.toString();
    if (!importMappingId || !action) return;
    try {
      if (action === "clone") {
        await tActions.importMapping.clone({
          id: importMappingId,
        });
      }

      return;
    } catch (error) {
      data.locals.global.logger('import').error({code: "IMP_0007", title: "Import Mapping Error", error});
      return;
    }
  },
};

export const _routeConfig = {
  searchParamsValidation: importMappingFilterSchema.catch({}),
} satisfies SingleServerRouteConfig;
