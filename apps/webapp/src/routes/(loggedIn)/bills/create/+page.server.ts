import { redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import { createBillSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { billPageAndFilterValidation } from "$lib/pageAndFilterValidation";
import { logging } from "$lib/server/logging";

export const load = async (data) => {
  authGuard(data);

  const form = await superValidate(zod4(createBillSchema));

  return { form };
};

const createBillSchemaWithPageAndFilter = z.object({
  ...createBillSchema.shape,
  ...billPageAndFilterValidation.shape,
});

export const actions = {
  default: async ({ request, locals }) => {
    const db = locals.db;
    const form = await superValidate(
      request,
      zod4(createBillSchemaWithPageAndFilter),
    );

    if (!form.valid) {
      return { form };
    }

    try {
      await tActions.bill.create(db, form.data);
    } catch (e) {
      logging.error("Create Bill Error", e);
      return message(form, "Error Creating Bill, Possibly Already Exists");
    }
    redirect(302, form.data.prevPage);
  },
};
