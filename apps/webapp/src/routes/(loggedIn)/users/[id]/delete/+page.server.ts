import { redirect } from "@sveltejs/kit";

import { userActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { urlGenerator } from "$lib/routes.js";

export const load = (requestData) => {
  authGuard(requestData);
};

export const actions = {
  default: async ({ params, locals }) => {
    const authUser = locals.user;
    if (!authUser) {
      return;
    }
    if (!authUser.admin || authUser.id === params.id) {
      return;
    }

    await userActions.deleteUser({ db: locals.db, userId: params.id });

    redirect(
      302,
      urlGenerator({
        address: "/(loggedIn)/users",
        searchParamsValue: { page: 0 },
      }).url,
    );
  },
};
