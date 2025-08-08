import { redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import { updateBudgetSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { labelPageAndFilterValidation } from "$lib/pageAndFilterValidation";
import { serverPageInfo } from "$lib/routes.server";

export const load = async (data) => {
  authGuard(data);
  const pageInfo = serverPageInfo(data.route.id, data);

  if (!pageInfo.current.params?.id) redirect(302, "/budgets");

  const budget = await tActions.budget.getById(pageInfo.current.params?.id);
  if (!budget) redirect(302, "/budgets");
  const form = await superValidate(
    { id: budget.id, title: budget.title, status: budget.status },
    zod4(updateBudgetSchema),
  );

  return {
    budget,
    form,
  };
};

const updateBudgetSchemaWithPageAndFilter = z.object({
  ...updateBudgetSchema.shape,
  ...labelPageAndFilterValidation.shape,
});

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(
      request,
      zod4(updateBudgetSchemaWithPageAndFilter),
    );

    if (!form.valid) {
      return { form };
    }

    try {
      await tActions.budget.update({ data: form.data, id: form.data.id });
    } catch (e) {
      locals.global.logger.error("Update Budget Error", e);
      return message(form, "Error Updating Budget");
    }
    redirect(302, form.data.prevPage);
  },
};
