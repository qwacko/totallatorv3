import { redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import { createLabelSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { labelPageAndFilterValidation } from "$lib/pageAndFilterValidation";

export const load = async (data) => {
  authGuard(data);

  const form = await superValidate(zod4(createLabelSchema));

  return { form };
};

const createLabelSchemaWithPageAndFilter = z.object({
  ...createLabelSchema.shape,
  ...labelPageAndFilterValidation.shape,
});

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(
      request,
      zod4(createLabelSchemaWithPageAndFilter),
    );

    if (!form.valid) {
      return { form };
    }

    try {
      await tActions.label.create(form.data);
    } catch (e) {
      locals.global.logger.error("Create Label Error", e);
      return message(form, "Error Creating Label, Possibly Already Exists");
    }
    redirect(302, form.data.prevPage);
  },
};
