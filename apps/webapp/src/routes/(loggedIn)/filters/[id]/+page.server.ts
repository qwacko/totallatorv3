import { redirect } from "@sveltejs/kit";
import { setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { journalFilterToText } from "@totallator/business-logic";
import { journalUpdateToText } from "@totallator/business-logic";
import { tActions } from "@totallator/business-logic";
import { journalFilterSchema, updateJournalSchema } from "@totallator/shared";
import {
  updateReusableFilterFormSchema,
  updateReusableFilterSchema,
} from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { reusableFilterPageAndFilterValidation } from "$lib/pageAndFilterValidation";
import { serverPageInfo, urlGenerator } from "$lib/routes";
import { bufferingHelper } from "$lib/server/bufferingHelper.js";
import { logging } from "$lib/server/logging";

export const load = async (data) => {
  authGuard(data);
  const db = data.locals.db;
  const { current } = serverPageInfo(data.route.id, data);
  bufferingHelper(data);

  if (!current.params || !current.searchParams) {
    redirect(
      302,
      urlGenerator({ address: "/(loggedIn)/filters", searchParamsValue: {} })
        .url,
    );
  }

  const reusableFilter = await tActions.reusableFitler.getById({
    db,
    id: current.params.id,
  });

  if (!reusableFilter) {
    redirect(
      302,
      urlGenerator({ address: "/(loggedIn)/filters", searchParamsValue: {} })
        .url,
    );
  }

  const change = current.searchParams?.change || reusableFilter.change;
  const changeText = await journalUpdateToText({ db, change });
  const filter = current.searchParams?.filter || reusableFilter.filter;
  const filterText = await journalFilterToText({ db, filter });

  const form = await superValidate(
    {
      id: reusableFilter.id,
      filter: JSON.stringify(filter),
      change: change ? JSON.stringify(change) : undefined,
      title: current.searchParams?.title || reusableFilter.title,
      group: current.searchParams?.group || reusableFilter.group || undefined,
      applyAutomatically:
        current.searchParams?.applyAutomatically ||
        reusableFilter.applyAutomatically,
      applyFollowingImport:
        current.searchParams?.applyFollowingImport ||
        reusableFilter.applyFollowingImport,
      listed: current.searchParams?.listed || reusableFilter.listed,
      modificationType:
        current.searchParams?.modificationType ||
        reusableFilter.modificationType ||
        undefined,
    },
    zod4(updateReusableFilterFormSchema),
  );

  const modificationForm = await superValidate(
    change || {},
    zod4(updateJournalSchema),
  );

  const numberResults = await tActions.journalView.count(db, filter);

  return {
    searchParams: current.searchParams,
    numberResults,
    id: reusableFilter.id,
    filter: reusableFilter,
    form,
    modificationForm,
    filterText,
    changeText,
  };
};

const filterFormSchemaWithPage = z.object({
  ...updateReusableFilterFormSchema.shape,
  ...reusableFilterPageAndFilterValidation.shape,
});

export const actions = {
  update: async (data) => {
    const form = await superValidate(
      data.request,
      zod4(filterFormSchemaWithPage),
    );

    if (!form.valid) {
      return form;
    }

    const { id, filter, change, prevPage, currentPage, ...restForm } =
      form.data;

    const processedUpdate = updateReusableFilterSchema.safeParse({
      ...restForm,
    });

    if (!processedUpdate.success) {
      logging.error(
        "Update Filter Error",
        JSON.stringify(processedUpdate.error, null, 2),
      );
      return setError(form, "Form Submission Error");
    }

    try {
      await tActions.reusableFitler.update({
        db: data.locals.db,
        id,
        data: processedUpdate.data,
      });
    } catch (e) {
      logging.error("Reusable Filter Update Error", e);
      return setError(form, "Reusable Filter Update Error");
    }

    return { form };
  },
  updateFilter: async (data) => {
    const form = await superValidate(
      data.request,
      zod4(filterFormSchemaWithPage),
    );
    const id = data.params.id;

    if (!form.valid) {
      return form;
    }

    const { filter } = form.data;

    if (!filter) {
      logging.error("Filter Is Required");
      return setError(form, "Filter Is Required");
    }

    const filterProcessed = journalFilterSchema.safeParse(JSON.parse(filter));

    if (!filterProcessed.success) {
      logging.error(
        "Filter Is Invalid",
        JSON.stringify(filterProcessed.error, null, 2),
      );
      return setError(form, "Filter Is Invalid");
    }

    try {
      await tActions.reusableFitler.update({
        db: data.locals.db,
        id,
        data: { filter: filterProcessed.data },
      });
    } catch (e) {
      logging.error("Reusable Filter Update Error", e);
      return setError(form, "Reusable Filter Update Error");
    }

    return { form };
  },
  updateChange: async (data) => {
    const form = await superValidate(data.request, zod4(updateJournalSchema));
    const id = data.params.id;

    if (!form.valid) {
      return form;
    }

    try {
      await tActions.reusableFitler.update({
        db: data.locals.db,
        id,
        data: { change: form.data },
      });
    } catch (e) {
      logging.error("Reusable Filter Update Change Error", e);
      return setError(form, "Reusable Filter Update Change Error");
    }

    return { form };
  },
};
