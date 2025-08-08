import { error, redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { categoryFilterToText } from "@totallator/business-logic";
import { tActions } from "@totallator/business-logic";
import { categoryFilterArray } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { serverPageInfo } from "$lib/routes.server.js";
import { associatedInfoFormActions } from "$lib/server/associatednfoFormActions.js";
import { fileFormActions } from "$lib/server/fileFormActions";
import { extractAutocompleteFromTextFilter } from "$lib/server/helpers/filterConfigExtractor.js";
import { noteFormActions } from "$lib/server/noteFormActions.js";

export const load = async (data) => {
  authGuard(data);
  const db = data.locals.db;
  const { current: pageInfo, updateParams } = serverPageInfo(
    data.route.id,
    data,
  );

  const categories = await tActions.category.list({
    filter: pageInfo.searchParams || { page: 0, pageSize: 10 },
  });
  const redirectRequired = categories.page >= categories.pageCount;
  if (redirectRequired) {
    const targetPage = Math.max(0, categories.pageCount - 1);
    redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
  }

  const filterText = await categoryFilterToText({
    db,
    filter: pageInfo.searchParams || { page: 0, pageSize: 10 },
  });

  // Generate autocomplete configuration from server-side filter array
  const autocompleteKeys = extractAutocompleteFromTextFilter(
    categoryFilterArray,
    "category",
  );

  return {
    categories: tActions.associatedInfo.addToItems({
      data: categories,
      grouping: "categoryId",
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
      await tActions.category.update({ data: form.data, id: form.data.id });
      return {
        status: 200,
        body: {
          message: "Category Updated",
        },
      };
    } catch (e) {
      locals.global.logger.error("Category Update Error", e);
      return error(500, "Error updating category");
    }
  },
};
