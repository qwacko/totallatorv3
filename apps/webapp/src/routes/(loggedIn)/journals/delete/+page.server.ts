import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";

import { tActions } from "@totallator/business-logic";
import { defaultJournalFilter, journalFilterSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { filterNullUndefinedAndDuplicates } from "$lib/helpers/filterNullUndefinedAndDuplicates.js";
import { pageAndFilterValidation } from "$lib/pageAndFilterValidation";
import { urlGenerator } from "$lib/routes.js";
import { serverPageInfo } from "$lib/routes.server.js";

export const load = async (data) => {
  authGuard(data);
  const pageInfo = serverPageInfo(data.route.id, data);

  const journalData = await tActions.journalView.list({
    filter: pageInfo.current.searchParams || defaultJournalFilter(),
  });

  return { count: journalData.count };
};

export const actions = {
  delete: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(pageAndFilterValidation));

    if (!form.valid) {
      redirect(302, form.data.currentPage);
    }

    const parsedFilter = journalFilterSchema.safeParse(
      JSON.parse(form.data.filter),
    );

    if (!parsedFilter.success) {
      redirect(302, form.data.currentPage);
    }

    try {
      const journals = await tActions.journalView.list({
        filter: parsedFilter.data,
      });

      const transactionIds = filterNullUndefinedAndDuplicates(
        journals.data.map((item) => item.transactionId),
      );

      await tActions.journal.hardDeleteTransactions({ transactionIds });
    } catch (e) {
      locals.global.logger.error("Error Updating Journal State : ", e);
      redirect(
        302,
        form.data.prevPage ||
          urlGenerator({
            address: "/(loggedIn)/journals",
            searchParamsValue: defaultJournalFilter(),
          }).url,
      );
    }

    redirect(302, form.data.prevPage);
  },
};

export const _routeConfig = {
  searchParamsValidation: journalFilterSchema
    .optional()
    .catch(defaultJournalFilter()),
} satisfies SingleServerRouteConfig;
