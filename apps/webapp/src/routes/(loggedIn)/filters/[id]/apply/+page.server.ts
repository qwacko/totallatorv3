import { redirect } from "@sveltejs/kit";

import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo, urlGenerator } from "$lib/routes";

export const load = async (data) => {
  authGuard(data);
  const db = data.locals.db;
  const { current } = serverPageInfo(data.route.id, data);

  if (!current.params?.id) {
    redirect(
      302,
      urlGenerator({ address: "/(loggedIn)/filters", searchParamsValue: {} })
        .url,
    );
  }

  const item = await tActions.reusableFitler.getById({
    db,
    id: current.params.id,
  });

  if (!item || !item.canApply) {
    redirect(
      302,
      urlGenerator({ address: "/(loggedIn)/filters", searchParamsValue: {} })
        .url,
    );
  }

  return {
    filter: item,
  };
};

export const actions = {
  default: async ({ params, request, locals }) => {
    const id = params.id;
    const form = await request.formData();
    const prevPage = form.get("prevPage");

    await tActions.reusableFitler.applyById({ db: locals.db, id });

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
