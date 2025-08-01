import { redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import { journalFilterArray } from "@totallator/business-logic";
import {
  journalFilterSchema,
  type JournalFilterSchemaType,
  journalFilterSchemaWithoutPagination,
  updateJournalSchema,
} from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo } from "$lib/routes";
import { associatedInfoFormActions } from "$lib/server/associatednfoFormActions.js";
import { fileFormActions } from "$lib/server/fileFormActions";
import { extractAutocompleteFromTextFilter } from "$lib/server/helpers/filterConfigExtractor.js";
import { noteFormActions } from "$lib/server/noteFormActions.js";

export const load = async (data) => {
  authGuard(data);
  const { current: pageInfo, updateParams } = serverPageInfo(
    data.route.id,
    data,
  );

  const filter: JournalFilterSchemaType = pageInfo.searchParams || {
    page: 0,
    pageSize: 10,
    orderBy: [{ field: "date", direction: "desc" }],
    account: { type: ["asset", "liability"] },
  };

  const { pageSize, page, orderBy, ...searchParamsWithoutPagination } = filter;

  if (filter.pageSize > 500) {
    redirect(302, updateParams({ searchParams: { pageSize: 10 } }).url);
  }

  const latestUpdate = await tActions.journalView.getLatestUpdateDate();

  // Generate autocomplete configuration from server-side filter array
  const autocompleteKeys = extractAutocompleteFromTextFilter(
    journalFilterArray,
    "journal",
  );

  return {
    searchParams: pageInfo.searchParams,
    searchParamsWithoutPagination,
    latestUpdate,
    autocompleteKeys,
  };
};

export const actions = {
  ...noteFormActions,
  ...fileFormActions,
  ...associatedInfoFormActions,
  updateJournal: async (data) => {
    const form = await superValidate(
      data.request,
      zod4(
        z.object({
          ...updateJournalSchema.shape,
          filter: journalFilterSchemaWithoutPagination,
        }),
      ),
    );

    if (!form.valid) {
      data.locals.global.logger.error("Update Form Is Not Valid");
      return { form };
    }

    const parsedFilter = journalFilterSchema.safeParse(form.data.filter);

    if (!parsedFilter.success) {
      data.locals.global.logger.error("Filter Is Not Valid");
      return { form };
    }

    console.log("Updating Journal", parsedFilter.data, form.data);

    try {
      await tActions.journal.updateJournals({
        filter: parsedFilter.data,
        journalData: form.data,
      });
    } catch (e) {
      data.locals.global.logger.error("Error Updating Journals : ", e);

      return message(form, "Error Updating Journals");
    }

    return { form };
  },

  update: async (data) => {
    const form = await data.request.formData();
    const journalId = form.get("journalId")?.toString();
    const action = form.get("action")?.toString();
    if (!journalId || !action) return;
    try {
      if (action === "uncomplete") {
        await tActions.journal.markUncomplete(journalId);
      }
      if (action === "complete") {
        await tActions.journal.markComplete(journalId);
      }
      if (action === "reconcile") {
        await tActions.journal.updateJournals({
          filter: { id: journalId },
          journalData: { setReconciled: true },
        });
      }
      if (action === "unreconcile") {
        await tActions.journal.updateJournals({
          filter: { id: journalId },
          journalData: { clearReconciled: true },
        });
      }
      if (action === "check") {
        await tActions.journal.updateJournals({
          filter: { id: journalId },
          journalData: { setDataChecked: true },
        });
      }
      if (action === "uncheck") {
        await tActions.journal.updateJournals({
          filter: { id: journalId },
          journalData: { clearDataChecked: true },
        });
      }
      return;
    } catch (error) {
      data.locals.global.logger.error(error);
      return;
    }
  },
};
