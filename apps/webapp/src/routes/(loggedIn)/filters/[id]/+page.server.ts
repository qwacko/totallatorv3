import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";
import { setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { journalFilterToText } from "@totallator/business-logic";
import { journalUpdateToText } from "@totallator/business-logic";
import { tActions } from "@totallator/business-logic";
import { journalFilterSchema, updateJournalSchema } from "@totallator/shared";
import {
  reusableFilterCreationURLParams,
  updateReusableFilterFormSchema,
  updateReusableFilterSchema,
} from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { reusableFilterPageAndFilterValidation } from "$lib/pageAndFilterValidation";
import { serverPageInfo, urlGeneratorServer } from "$lib/routes.server";
import { bufferingHelper } from "$lib/server/bufferingHelper.js";

export const load = async (data) => {
  authGuard(data);
  const db = data.locals.db;
  const { current } = serverPageInfo(data.route.id, data);
  bufferingHelper(data);

  if (!current.params || !current.searchParams) {
    redirect(
      302,
      urlGeneratorServer({
        address: "/(loggedIn)/filters",
        searchParamsValue: {},
      }).url,
    );
  }

  const reusableFilter = await tActions.reusableFitler.getById({
    id: current.params.id,
  });

  if (!reusableFilter) {
    redirect(
      302,
      urlGeneratorServer({
        address: "/(loggedIn)/filters",
        searchParamsValue: {},
      }).url,
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

  const numberResults = await tActions.journalView.count(filter);

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
      data.locals.global.logger('queries').error({
        code: "QRY_0002",
        title: "Update Filter Error",
        error: JSON.stringify(processedUpdate.error, null, 2)
      });
      return setError(form, "Form Submission Error");
    }

    try {
      await tActions.reusableFitler.update({
        id,
        data: processedUpdate.data,
      });
    } catch (e) {
      data.locals.global.logger('queries').error({code: "QRY_0003", title: "Reusable Filter Update Error", error: e});
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
      data.locals.global.logger('queries').error({code: "QRY_0004", title: "Filter Is Required"});
      return setError(form, "Filter Is Required");
    }

    const filterProcessed = journalFilterSchema.safeParse(JSON.parse(filter));

    if (!filterProcessed.success) {
      data.locals.global.logger('queries').error({
        code: "QRY_0005",
        title: "Filter Is Invalid",
        error: JSON.stringify(filterProcessed.error, null, 2)
      });
      return setError(form, "Filter Is Invalid");
    }

    try {
      await tActions.reusableFitler.update({
        id,
        data: { filter: filterProcessed.data },
      });
    } catch (e) {
      data.locals.global.logger('queries').error({code: "QRY_0006", title: "Reusable Filter Update Error", error: e});
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
        id,
        data: { change: form.data },
      });
    } catch (e) {
      data.locals.global.logger('queries').error({code: "QRY_0007", title: "Reusable Filter Update Change Error", error: e});
      return setError(form, "Reusable Filter Update Change Error");
    }

    return { form };
  },
};

export const _routeConfig = {
  paramsValidation: z.object({ id: z.string() }),
  searchParamsValidation: reusableFilterCreationURLParams.optional(),
} satisfies SingleServerRouteConfig;
