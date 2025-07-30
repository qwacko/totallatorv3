import { redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import { createBudgetSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { budgetPageAndFilterValidation } from "$lib/pageAndFilterValidation";
import { logging } from "$lib/server/logging";

export const load = async (data) => {
  authGuard(data);

  const form = await superValidate(zod4(createBudgetSchema));

  return { form };
};

const createBudgetSchemaWithPageAndFilter = z.object({
  ...createBudgetSchema.shape,
  ...budgetPageAndFilterValidation.shape,
});

export const actions = {
  default: async ({ request, locals }) => {
    const db = locals.db;
    const form = await superValidate(
      request,
      zod4(createBudgetSchemaWithPageAndFilter),
    );

    if (!form.valid) {
      return { form };
    }

    try {
      await tActions.budget.create(db, form.data);
    } catch (e) {
      logging.error("Create Budget Error", e);
      return message(form, "Error Creating Budget, Possibly Already Exists");
    }
    redirect(302, form.data.prevPage);
  },
};
