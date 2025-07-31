import { redirect } from "@sveltejs/kit";

import { tActions } from "@totallator/business-logic";

import { urlGenerator } from "$lib/routes";

export const actions = {
  default: async ({ params, locals }) => {
    const db = locals.db;
    let deleted = false;
    try {
      await tActions.import.forgetImport({ db, id: params.id });
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
