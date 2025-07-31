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
      await tActions.backup.importFile({ db: locals.db, backupFile, id });
    } catch (e) {
      locals.global.logger.error(
        `Backup Import Failed. Incorrect Contents - ${backupFile.name}`,
      );
      locals.global.logger.error("Error", e);
      return;
    }

    redirect(
      302,
      urlGenerator({ address: "/(loggedIn)/backup/[id]", paramsValue: { id } })
        .url,
    );
  },
};
