import { redirect } from "@sveltejs/kit";

import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { serverPageInfo, urlGenerator } from "$lib/routes";

export const load = async (data) => {
  authGuard(data);
  const db = data.locals.db;
  const { current } = serverPageInfo(data.route.id, data);

  if (!current.params) {
    redirect(
      302,
      urlGenerator({
        address: "/(loggedIn)/importMapping",
        searchParamsValue: {},
      }).url,
    );
  }

  const importMappingInfo = await tActions.importMapping.getById({
    db,
    id: current.params.id,
  });

  if (!importMappingInfo) {
    redirect(
      302,
      urlGenerator({
        address: "/(loggedIn)/importMapping",
        searchParamsValue: {},
      }).url,
    );
  }

  return {
    importMapping: importMappingInfo,
  };
};

export const actions = {
  default: async ({ params, request, locals }) => {
    const id = params.id;
    const form = await request.formData();
    const prevPage = form.get("prevPage");

    await tActions.importMapping.delete({ db: locals.db, id });

    redirect(
      302,
      prevPage
        ? prevPage.toString()
        : urlGenerator({
            address: "/(loggedIn)/filters",
            searchParamsValue: {},
          }).url,
    );
  },
};
