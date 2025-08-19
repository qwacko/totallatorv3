import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import {
  cloneJournalUpdateSchema,
  defaultJournalFilter,
  journalFilterSchema,
} from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { pageAndFilterValidation } from "$lib/pageAndFilterValidation";
import { serverPageInfo } from "$lib/routes.server.js";

export const load = async (data) => {
  authGuard(data);
  const pageInfo = serverPageInfo(data.route.id, data);

  const journalData = await tActions.journalView.listWithCommonData({
    filter: pageInfo.current.searchParams || defaultJournalFilter(),
  });

  const { allLabelIds, commonLabelIds, ...journalDataForForm } =
    journalData.common;

  const form = await superValidate(
    journalDataForForm,
    zod4(cloneJournalUpdateSchema),
  );

  return {
    selectedJournals: {
      reconciled: journalData.common.reconciled,
      complete: journalData.common.complete,
      dataChecked: journalData.common.dataChecked,
      count: journalData.journals.data.length,
      canEdit: journalData.common.complete === false,
    },
    form,
    allLabelIds: allLabelIds.filter(
      (labelId) => !commonLabelIds.includes(labelId),
    ),
    commonLabelIds,
  };
};

const cloneValidation = z.object({
  ...cloneJournalUpdateSchema.shape,
  ...pageAndFilterValidation.shape,
});

export const actions = {
  clone: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(cloneValidation));

    if (!form.valid) {
      locals.global.logger('journals').error({code: "JRN_0002", title: "Clone Form Is Not Valid"});
      redirect(302, form.data.currentPage);
    }

    const parsedFilter = journalFilterSchema.safeParse(
      JSON.parse(form.data.filter),
    );

    if (!parsedFilter.success) {
      locals.global.logger('journals').error({code: "JRN_0003", title: "Clone Filter Is Not Valid"});
      redirect(302, form.data.currentPage);
    }

    try {
      await tActions.journal.cloneJournals({
        filter: parsedFilter.data,
        journalData: form.data,
      });
    } catch (e) {
      locals.global.logger('journals').error({code: "JRN_0004", title: "Error Cloning Journals", error: e});

      return message(form, "Error Cloning Journals");
    }

    redirect(302, form.data.prevPage);
  },
};

export const _routeConfig = {
  searchParamsValidation: journalFilterSchema
    .optional()
    .catch(defaultJournalFilter()),
} satisfies SingleServerRouteConfig;
