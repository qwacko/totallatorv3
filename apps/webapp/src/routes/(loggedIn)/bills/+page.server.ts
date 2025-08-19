import { error, redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { billFilterToText } from "@totallator/business-logic";
import { tActions } from "@totallator/business-logic";
import { billFilterArray } from "@totallator/business-logic";
import { billFilterSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { serverPageInfo } from "$lib/routes.server.js";
import { associatedInfoFormActions } from "$lib/server/associatednfoFormActions.js";
import { fileFormActions } from "$lib/server/fileFormActions";
import { extractAutocompleteFromTextFilter } from "$lib/server/helpers/filterConfigExtractor.js";
import { noteFormActions } from "$lib/server/noteFormActions.js";

export const _routeConfig = {
  searchParamsValidation: billFilterSchema.optional().catch({}),
} satisfies SingleServerRouteConfig;

export const load = async (data) => {
  authGuard(data);
  const db = data.locals.db;
  const { current: pageInfo, updateParams } = serverPageInfo(
    data.route.id,
    data,
  );

  const bills = await tActions.bill.list({
    filter: pageInfo.searchParams || { page: 0, pageSize: 10 },
  });

  const redirectRequired = bills.page >= bills.pageCount;
  if (redirectRequired) {
    const targetPage = Math.max(0, bills.pageCount - 1);
    redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
  }

  const filterText = await billFilterToText({
    db,
    filter: pageInfo.searchParams || { page: 0, pageSize: 10 },
  });

  // Generate autocomplete configuration from server-side filter array
  const autocompleteKeys = extractAutocompleteFromTextFilter(
    billFilterArray,
    "bill",
  );

  return {
    bills: tActions.associatedInfo.addToItems({
      data: bills,
      grouping: "billId",
    }),
    searchParams: pageInfo.searchParams,
    filterText,
    autocompleteKeys,
  };
};

const submitValidation = z.object({
  id: z.string(),
  status: z.enum(["active", "disabled"]),
});

export const actions = {
  ...noteFormActions,
  ...fileFormActions,
  ...associatedInfoFormActions,
  update: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(submitValidation));

    if (!form.valid) {
      return error(400, "Invalid form data");
    }

    try {
      await tActions.bill.update({ data: form.data, id: form.data.id });
      return {
        status: 200,
        body: {
          message: "Bill Updated",
        },
      };
    } catch (e) {
      locals.global.logger('bills').error({code: "BIL_0003", title: "Bill Update Error", error: e});
      return error(500, "Error updating bll");
    }
  },
};
