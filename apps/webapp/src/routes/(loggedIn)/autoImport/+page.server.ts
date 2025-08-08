import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo } from "$lib/routes.server";
import { associatedInfoFormActions } from "$lib/server/associatednfoFormActions.js";
import { fileFormActions } from "$lib/server/fileFormActions";
import { noteFormActions } from "$lib/server/noteFormActions";

export const load = async (request) => {
  authGuard(request);
  const { current } = serverPageInfo(request.route.id, request);

  const filter = current.searchParams || {};

  const autoImportList = await tActions.autoImport.list({
    filter,
  });

  return {
    list: tActions.associatedInfo.addToItems({
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
        id: id.toString(),
      });
    } catch (e) {
      locals.global.logger.error("Error Cloning Auto Import", e);
    }
  },
};
