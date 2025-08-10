import { error, redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { accountFilterToText } from "@totallator/business-logic";
import { tActions } from "@totallator/business-logic";
import { accountFilterArray } from "@totallator/business-logic";
import { accountFilterSchema, accountTypeEnum } from "@totallator/shared";
import {
  defaultAllJournalFilter,
  type JournalFilterSchemaInputType,
} from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { serverPageInfo } from "$lib/routes.server.js";
import { associatedInfoFormActions } from "$lib/server/associatednfoFormActions.js";
import { fileFormActions } from "$lib/server/fileFormActions";
import { extractAutocompleteFromTextFilter } from "$lib/server/helpers/filterConfigExtractor.js";
import { noteFormActions } from "$lib/server/noteFormActions";

export const _routeConfig = {
  searchParamsValidation: accountFilterSchema.optional().catch({}),
} satisfies SingleServerRouteConfig;

export const load = async (data) => {
  authGuard(data);
  const db = data.locals.db;
  const { current: pageInfo, updateParams } = serverPageInfo(
    data.route.id,
    data,
  );

  const searchParams = pageInfo.searchParams || { page: 0, pageSize: 10 };

  const accounts = await tActions.account.list({
    filter: searchParams,
  });
  const redirectRequired = accounts.page >= accounts.pageCount;
  if (redirectRequired) {
    const targetPage = Math.max(0, accounts.pageCount - 1);
    redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
  }

  const filteredItems = {
    ...defaultAllJournalFilter(),
    account: {
      type:
        searchParams.id || (searchParams.title && searchParams.title !== "")
          ? [...accountTypeEnum]
          : ["asset", "liability"],
      ...searchParams,
    },
  } satisfies JournalFilterSchemaInputType;

  const accountSummary = await tActions.journalView.summary({
    filter: filteredItems,
  });

  const filterText = await accountFilterToText({
    filter: pageInfo.searchParams || { page: 0, pageSize: 10 },
    db,
  });

  // Generate autocomplete configuration from server-side filter array
  const autocompleteKeys = extractAutocompleteFromTextFilter(
    accountFilterArray,
    "account",
  );

  return {
    accounts: tActions.associatedInfo.addToItems({
      data: accounts,
      grouping: "accountId",
    }),
    searchParams: pageInfo.searchParams,
    filterText,
    accountSummary,
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
      const { id, ...restData } = form.data;
      await tActions.account.update({ id, data: restData });
      return {
        status: 200,
        body: {
          message: "Account Updated",
        },
      };
    } catch (e) {
      locals.global.logger.error("Account Update Error", e);
      return error(500, "Error updating account");
    }
  },
};
