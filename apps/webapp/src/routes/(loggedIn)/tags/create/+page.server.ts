import { redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import { createTagSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { tagPageAndFilterValidation } from "$lib/pageAndFilterValidation";

export const load = async (data) => {
  authGuard(data);

  const form = await superValidate(zod4(createTagSchema));

  return { form };
};

const createTagSchemaWithPageAndFilter = z.object({
  ...createTagSchema.shape,
  ...tagPageAndFilterValidation.shape,
});

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(
      request,
      zod4(createTagSchemaWithPageAndFilter),
    );

    if (!form.valid) {
      return { form };
    }

    try {
      await tActions.tag.create(form.data);
    } catch (e) {
      locals.global.logger.error("Create Tag Error", e);
      return message(form, "Error Creating Tag, Possibly Already Exists");
    }
    redirect(302, form.data.prevPage);
  },
};
