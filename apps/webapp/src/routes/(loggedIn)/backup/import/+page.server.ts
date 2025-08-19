import { redirect } from "@sveltejs/kit";
import { nanoid } from "nanoid";

import { tActions } from "@totallator/business-logic";

import { urlGenerator } from "$lib/routes.js";

export const actions = {
  import: async ({ request, locals }) => {
    const formData = await request.formData();
    const backupFile = formData.get("backupFile") as File;

    const id = nanoid();

    try {
      await tActions.backup.importFile({ backupFile, id });
    } catch (e) {
      locals.global.logger('backup').error({
        code: "BCK_0006",
        title: "Backup Import Failed. Incorrect Contents",
        filename: backupFile.name
      });
      locals.global.logger('backup').error({code: "BCK_0007", title: "Backup Import Error", error: e});
      return;
    }

    redirect(
      302,
      urlGenerator({ address: "/(loggedIn)/backup/[id]", paramsValue: { id } })
        .url,
    );
  },
};
