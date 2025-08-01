import { redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import {
  createSimpleTransactionSchemaCore,
  journalFilterSchema,
} from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { pageAndFilterValidation } from "$lib/pageAndFilterValidation";

export const load = async (data) => {
  authGuard(data);

  const form = await superValidate(
    {
      date: new Date().toISOString().slice(0, 10),
      description: "",
      amount: 0,
      importId: null,
      importDetailId: null,
      linked: true,
      reconciled: false,
      dataChecked: false,
      complete: false,
      tagTitle: null,
      tagId: undefined,
      billTitle: null,
      billId: undefined,
      budgetTitle: null,
      budgetId: undefined,
      categoryTitle: null,
      categoryId: undefined,
      fromAccountTitle: null,
      fromAccountId: undefined,
      toAccountTitle: null,
      toAccountId: undefined,
    },
    zod4(createSimpleTransactionSchemaCore),
  );

  return { form };
};

const createValidation = z.object({
  ...createSimpleTransactionSchemaCore.shape,
  ...pageAndFilterValidation.shape,
});

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(createValidation));

    if (!form.valid) {
      locals.global.logger.error("Update Form Is Not Valid", form.errors);
      return { form };
    }

    const parsedFilter = journalFilterSchema.safeParse(
      JSON.parse(form.data.filter),
    );

    if (!parsedFilter.success) {
      locals.global.logger.error(
        "Update Filter Is Not Valid",
        parsedFilter.error,
      );
      redirect(302, form.data.currentPage);
    }

    try {
      await tActions.journal.createFromSimpleTransaction({
        transaction: form.data,
      });
    } catch (e) {
      locals.global.logger.error("Create Transaction Error", e);
      return message(form, "Error Creating Transaction");
    }
    redirect(302, form.data.prevPage);
  },
};
