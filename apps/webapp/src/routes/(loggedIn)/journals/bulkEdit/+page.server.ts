import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import {
  defaultJournalFilter,
  journalFilterSchema,
  updateJournalSchema,
} from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { pageAndFilterValidation } from "$lib/pageAndFilterValidation";
import { serverPageInfo, urlGeneratorServer } from "$lib/routes.server.js";

export const load = async (data) => {
  authGuard(data);
  const pageInfo = serverPageInfo(data.route.id, data);

  const journalData = await tActions.journalView.listWithCommonData({
    filter: pageInfo.current.searchParams || defaultJournalFilter(),
  });

  const getRecommendations = async () => {
    const baseRecommendations = await tActions.journalView.listRecommendations({
      journals: journalData.journals.data,
    });

    return baseRecommendations?.map((rec) => ({
      ...rec,
      source: "similarity" as const,
    }));
  };

  const recommendations = getRecommendations();

  const {
    allLabelIds,
    commonLabelIds,
    reconciled,
    dataChecked,
    complete,
    linked,
    ...journalDataForForm
  } = journalData.common;

  const form = await superValidate(
    {
      ...journalDataForForm,
      setReconciled: reconciled === true ? true : undefined,
      clearReconciled: reconciled === false ? true : undefined,
      setDataChecked: dataChecked === true ? true : undefined,
      clearDataChecked: dataChecked === false ? true : undefined,
      setComplete: complete === true ? true : undefined,
      clearComplete: complete === false ? true : undefined,
      setLinked: linked === true ? true : undefined,
      clearLinked: linked === false ? true : undefined,
    },
    zod4(updateJournalSchema),
  );

  return {
    recommendations,
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
const updateStateActionValidation = z.object({
  ...pageAndFilterValidation.shape,
  action: z.enum([
    "reconciled",
    "complete",
    "dataChecked",
    "unreconciled",
    "incomplete",
    "dataNotChecked",
  ]),
});

const updateValidation = z.object({
  ...updateJournalSchema.shape,
  ...pageAndFilterValidation.shape,
});

export const actions = {
  updateState: async ({ request, locals }) => {
    const form = await superValidate(
      request,
      zod4(updateStateActionValidation),
    );

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
      if (form.data.action === "complete") {
        await tActions.journal.markManyComplete({
          journalFilter: parsedFilter.data,
        });
      } else if (form.data.action === "incomplete") {
        await tActions.journal.markManyUncomplete({
          journalFilter: parsedFilter.data,
        });
      } else {
        const setReconciled = form.data.action === "reconciled";
        const clearReconciled = form.data.action === "unreconciled";
        const setDataChecked = form.data.action === "dataChecked";
        const clearDataChecked = form.data.action === "dataNotChecked";

        await tActions.journal.updateJournals({
          filter: parsedFilter.data,
          journalData: {
            setReconciled,
            clearReconciled,
            setDataChecked,
            clearDataChecked,
          },
        });
      }
    } catch (e) {
      locals.global.logger.error("Error Updating Journal State : ", e);
      redirect(
        302,
        form.data.prevPage ||
          urlGeneratorServer({
            address: "/(loggedIn)/journals",
            searchParamsValue: defaultJournalFilter(),
          }).url,
      );
    }

    redirect(302, form.data.prevPage);
  },
  update: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(updateValidation));

    if (!form.valid) {
      locals.global.logger.error("Update Form Is Not Valid");
      redirect(302, form.data.currentPage);
    }

    const parsedFilter = journalFilterSchema.safeParse(
      JSON.parse(form.data.filter),
    );

    if (!parsedFilter.success) {
      locals.global.logger.error("Update Filter Is Not Valid");
      redirect(302, form.data.currentPage);
    }

    try {
      await tActions.journal.updateJournals({
        filter: parsedFilter.data,
        journalData: form.data,
      });
    } catch (e) {
      locals.global.logger.error("Error Updating Journals : ", e);

      return message(form, "Error Updating Journals");
    }

    redirect(302, form.data.prevPage);
  },
};

export const _routeConfig = {
  searchParamsValidation: journalFilterSchema
    .optional()
    .catch(defaultJournalFilter()),
} satisfies SingleServerRouteConfig;
