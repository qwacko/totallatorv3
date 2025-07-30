import { redirect } from "@sveltejs/kit";

import { reusableFilterToText } from "@totallator/business-logic";
import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { serverPageInfo } from "$lib/routes.js";
import { bufferingHelper } from "$lib/server/bufferingHelper.js";
import { logging } from "$lib/server/logging";

export const load = async (data) => {
  authGuard(data);
  const db = data.locals.db;
  const { current, updateParams } = serverPageInfo(data.route.id, data);
  bufferingHelper(data);

  const filterInfo = current.searchParams || {};

  const filters = await tActions.reusableFitler.list({
    db,
    filter: filterInfo,
  });

  const redirectRequired = filters.page >= filters.pageCount;
  if (redirectRequired) {
    const targetPage = Math.max(0, filters.pageCount - 1);
    redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
  }

  const filterText = await reusableFilterToText(current.searchParams || {});

  return {
    filters,
    filterText,
    searchParams: current.searchParams,
    streamed: {
      filters: tActions.reusableFitler.updateAndList({
        db,
        filter: filterInfo,
        maximumTime: 2000,
      }),
    },
  };
};

export const actions = {
  refreshAll: async ({ locals }) => {
    const db = locals.db;

    await tActions.reusableFitler.refreshAll({ db, maximumTime: 60000 });
  },
  refreshSome: async ({ locals, params, request }) => {
    const db = locals.db;

    const form = await request.formData();
    const ids = form.getAll("id");

    const idsArray = ids.map((id) => id.toString());

    try {
      await tActions.reusableFitler.refreshSome({ db, ids: idsArray });
    } catch (e) {
      logging.error("Error Refreshing Some Filters", e);
    }
  },
};
