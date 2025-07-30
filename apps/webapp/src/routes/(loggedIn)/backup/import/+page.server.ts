import { redirect } from "@sveltejs/kit";
import { nanoid } from "nanoid";

import { tActions } from "@totallator/business-logic";

import { urlGenerator } from "$lib/routes.js";
import { logging } from "$lib/server/logging.js";

export const actions = {
  import: async ({ request, locals }) => {
    const formData = await request.formData();
    const backupFile = formData.get("backupFile") as File;

    const id = nanoid();

    try {
      await tActions.backup.importFile({ db: locals.db, backupFile, id });
    } catch (e) {
      logging.error(
        `Backup Import Failed. Incorrect Contents - ${backupFile.name}`,
      );
      logging.error("Error", e);
      return;
    }

    redirect(
      302,
      urlGenerator({ address: "/(loggedIn)/backup/[id]", paramsValue: { id } })
        .url,
    );
  },
};
