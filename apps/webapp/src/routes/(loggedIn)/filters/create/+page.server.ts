import { redirect } from "@sveltejs/kit";
import { message, setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { journalFilterToText } from "@totallator/business-logic";
import { tActions } from "@totallator/business-logic";
import { journalUpdateToText } from "@totallator/business-logic";
import {
  defaultJournalFilter,
  journalFilterSchema,
  updateJournalSchema,
} from "@totallator/shared";
import {
  createReusableFilterFormSchema,
  createReusableFilterSchema,
} from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { reusableFilterPageAndFilterValidation } from "$lib/pageAndFilterValidation";
import { serverPageInfo, urlGenerator } from "$lib/routes";
import { bufferingHelper } from "$lib/server/bufferingHelper";

export const load = async (data) => {
  authGuard(data);
  const db = data.locals.db;
  const { current } = serverPageInfo(data.route.id, data);
  bufferingHelper(data);

  const filter = current.searchParams?.filter || defaultJournalFilter();
  const change = current.searchParams?.change;

  const filterText = await journalFilterToText({ db, filter });
  const changeText = change
    ? await journalUpdateToText({ db, change })
    : undefined;

  const form = await superValidate(
    {
      filter: JSON.stringify(filter),
      change: change ? JSON.stringify(change) : undefined,
      title: current.searchParams?.title || filterText.join(", "),
      group: current.searchParams?.group || undefined,
      applyAutomatically: current.searchParams?.applyAutomatically,
      applyFollowingImport: current.searchParams?.applyFollowingImport,
      listed: current.searchParams?.listed,
      modificationType: current.searchParams?.modificationType,
    },
    zod4(createReusableFilterFormSchema),
  );

  const modificationForm = await superValidate(
    change || {},
    zod4(updateJournalSchema),
  );

  const numberResults = await tActions.journalView.count(db, filter);

  return {
    searchParams: current.searchParams,
    form,
    modificationForm,
    filterText,
    changeText,
    numberResults,
  };
};

const filterFormSchemaWithPage = z.object({
  ...createReusableFilterFormSchema.shape,
  ...reusableFilterPageAndFilterValidation.shape,
});

export const actions = {
  default: async (data) => {
    const form = await superValidate(
      data.request,
      zod4(filterFormSchemaWithPage),
    );

    if (!form.valid) {
      return form;
    }

    const {
      filter: filterText,
      change: changeText,
      prevPage,
      currentPage,
      ...restForm
    } = form.data;

    if (!filterText) {
      return setError(form, "Filter Is Required");
    }

    const filter = journalFilterSchema.safeParse(JSON.parse(filterText));

    if (!filter.success) {
      return setError(form, "filter", "Filter Is Invalid");
    }

    const change = changeText
      ? updateJournalSchema.safeParse(JSON.parse(changeText))
      : undefined;

    if (change && !change.success) {
      return setError(form, "change", "Change Is Invalid");
    }

    const processedCreation = createReusableFilterSchema.safeParse({
      ...restForm,
      change: change ? change.data : undefined,
      filter: filter.data,
    });

    if (!processedCreation.success) {
      return message(form, "Form Submission Error");
    }
    let newFilterId: string | undefined = undefined;

    try {
      const newFilter = await tActions.reusableFitler.create({
        db: data.locals.db,
        data: processedCreation.data,
      });
      if (newFilter?.id) {
        newFilterId = newFilter.id;
      } else {
        return message(form, "Reusable Filter Not Created");
      }
    } catch (e) {
      return message(form, "Reusable Filter Creation Error");
    }

    redirect(
      302,
      urlGenerator({
        address: "/(loggedIn)/filters/[id]",
        paramsValue: { id: newFilterId },
        searchParamsValue: {},
      }).url,
    );
    return;
  },
};
