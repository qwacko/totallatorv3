import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import { accountFilterToText } from "@totallator/business-logic";
import { accountFilterSchema, updateAccountSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { accountPageAndFilterValidation } from "$lib/pageAndFilterValidation.js";
import {
  serverPageInfo,
  urlGeneratorServer as urlGenerator,
} from "$lib/routes.server";

export const load = async (data) => {
  authGuard(data);
  const db = data.locals.db;
  const pageInfo = serverPageInfo(data.route.id, data);

  const filter = pageInfo.current.searchParams;

  if (!filter) redirect(302, "/accounts");

  const commonData = await tActions.account.listCommonProperties({
    filter,
  });
  const accounts = await tActions.account.list({ filter });

  if (!commonData) redirect(302, "/accounts");

  const form = await superValidate(commonData, zod4(updateAccountSchema));
  const filterText = await accountFilterToText({ filter, db });

  const titles = accounts.data.map((item) => item.title);

  const numberItems = accounts.count;

  return {
    idArray: filter,
    form,
    titles,
    filterText,
    numberItems,
  };
};

const submitValidation = z.object({
  ...updateAccountSchema.shape,
  ...accountPageAndFilterValidation.shape,
});

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(submitValidation));
    if (!form.valid) {
      redirect(302, form.data.currentPage);
    }

    const parsedFilter = accountFilterSchema.safeParse(
      JSON.parse(form.data.filter),
    );

    if (!parsedFilter.success) {
      redirect(302, form.data.currentPage);
    }

    try {
      const { currentPage, prevPage, filter, ...restData } = form.data;
      await tActions.account.updateMany({
        filter: parsedFilter.data,
        data: restData,
      });
    } catch (e) {
      locals.global.logger('accounts').error({code: "ACC_0001", title: "Error Updating Journal State", error: e});
      redirect(
        302,
        form.data.prevPage ||
          urlGenerator({
            address: "/(loggedIn)/accounts",
            searchParamsValue: {},
          }).url,
      );
    }

    redirect(302, form.data.prevPage);
  },
};

export const _routeConfig = {
  searchParamsValidation: accountFilterSchema.catch({}),
} satisfies SingleServerRouteConfig;
