import { redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import { createCategorySchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { categoryPageAndFilterValidation } from "$lib/pageAndFilterValidation";
import { logging } from "$lib/server/logging";

export const load = async (data) => {
  authGuard(data);

  const form = await superValidate(zod4(createCategorySchema));

  return { form };
};

const createCategorySchemaWithPageAndFilter = z.object({
  ...createCategorySchema.shape,
  ...categoryPageAndFilterValidation.shape,
});

export const actions = {
  default: async ({ request, locals }) => {
    const db = locals.db;
    const form = await superValidate(
      request,
      zod4(createCategorySchemaWithPageAndFilter),
    );

    if (!form.valid) {
      return { form };
    }

    try {
      await tActions.category.create(db, form.data);
    } catch (e) {
      logging.error("Create Category Error", e);
      return message(form, "Error Creating Category, Possibly Already Exists");
    }
    redirect(302, form.data.prevPage);
  },
};
