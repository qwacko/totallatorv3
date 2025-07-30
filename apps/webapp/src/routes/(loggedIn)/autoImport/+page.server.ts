import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo } from "$lib/routes";
import { associatedInfoFormActions } from "$lib/server/associatednfoFormActions.js";
import { fileFormActions } from "$lib/server/fileFormActions";
import { logging } from "$lib/server/logging.js";
import { noteFormActions } from "$lib/server/noteFormActions";

export const load = async (request) => {
  authGuard(request);
  const { current } = serverPageInfo(request.route.id, request);

  const filter = current.searchParams || {};

  const autoImportList = await tActions.autoImport.list({
    db: request.locals.db,
    filter,
  });

  return {
    list: tActions.associatedInfo.addToItems({
      db: request.locals.db,
      data: autoImportList,
      grouping: "autoImportId",
    }),
    filter,
  };
};

export const actions = {
  ...noteFormActions,
  ...fileFormActions,
  ...associatedInfoFormActions,
  clone: async ({ request, locals }) => {
    const form = await request.formData();
    const id = form.get("id");

    if (!id) {
      return;
    }

    try {
      await tActions.autoImport.clone({
        db: locals.db,
        id: id.toString(),
      });
    } catch (e) {
      logging.error("Error Cloning Auto Import", e);
    }
  },
};
