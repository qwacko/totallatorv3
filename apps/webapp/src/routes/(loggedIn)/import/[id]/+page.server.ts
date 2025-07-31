import { redirect } from "@sveltejs/kit";

import { tActions } from "@totallator/business-logic";

import { urlGenerator } from "$lib/routes";

export const actions = {
  reprocess: async ({ params, locals }) => {
    try {
      await tActions.import.reprocess({ db: locals.db, id: params.id });
    } catch (e) {
      locals.global.logger.error("Reprocess Import Error", JSON.stringify(e, null, 2));
    }
  },
  triggerImport: async ({ params, locals }) => tActions.import.triggerImport({ db: locals.db, id: params.id }),
  clean: async ({ params, locals }) => {
    try {
      await tActions.import.clean({ db: locals.db, id: params.id });
    } catch (e) {
      locals.global.logger.error("Clean Import Error", JSON.stringify(e, null, 2));
    }

    const importData = await tActions.import.get({
      db: locals.db,
      id: params.id,
    });

    if (!importData.importInfo) {
      return redirect(
        302,
        urlGenerator({ address: "/(loggedIn)/import", searchParamsValue: {} })
          .url,
      );
    }
  },
  toggleAutoClean: async ({ params, locals }) => {
    const db = locals.db;
    const id = params.id;

    const importData = await tActions.import.get({ db, id });

    if (!importData.importInfo) {
      return;
    }

    await tActions.import.update({
      db,
      data: { id, autoClean: !importData.importInfo.import.autoClean },
    });
  },
  toggleAutoProcess: async ({ params, locals }) => {
    const db = locals.db;
    const id = params.id;

    const importData = await tActions.import.get({ db, id });

    if (!importData.importInfo) {
      return;
    }

    await tActions.import.update({
      db,
      data: { id, autoProcess: !importData.importInfo.import.autoProcess },
    });
  },
};
