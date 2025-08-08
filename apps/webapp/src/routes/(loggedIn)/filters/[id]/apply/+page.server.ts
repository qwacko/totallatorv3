import { redirect } from "@sveltejs/kit";

import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo, urlGeneratorServer } from "$lib/routes.server";

export const load = async (data) => {
  authGuard(data);
  const { current } = serverPageInfo(data.route.id, data);

  if (!current.params?.id) {
    redirect(
      302,
      urlGeneratorServer({
        address: "/(loggedIn)/filters",
        searchParamsValue: {},
      }).url,
    );
  }

  const item = await tActions.reusableFitler.getById({
    id: current.params.id,
  });

  if (!item || !item.canApply) {
    redirect(
      302,
      urlGeneratorServer({
        address: "/(loggedIn)/filters",
        searchParamsValue: {},
      }).url,
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

    await tActions.reusableFitler.applyById({ id });

    redirect(
      302,
      prevPage
        ? prevPage.toString()
        : urlGeneratorServer({
            address: "/(loggedIn)/filters",
            searchParamsValue: {},
          }).url,
    );
  },
};
