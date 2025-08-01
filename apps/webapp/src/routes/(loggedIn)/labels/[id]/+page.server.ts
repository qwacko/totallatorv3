import { redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import { updateLabelSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { labelPageAndFilterValidation } from "$lib/pageAndFilterValidation";
import { serverPageInfo } from "$lib/routes";

export const load = async (data) => {
  authGuard(data);
  const pageInfo = serverPageInfo(data.route.id, data);

  if (!pageInfo.current.params?.id) redirect(302, "/labels");

  const label = await tActions.label.getById(pageInfo.current.params?.id);
  if (!label) redirect(302, "/labels");
  const form = await superValidate(
    { id: label.id, title: label.title, status: label.status },
    zod4(updateLabelSchema),
  );

  return {
    label,
    form,
  };
};

const updateLabelSchemaWithPageAndFilter = z.object({
  ...updateLabelSchema.shape,
  ...labelPageAndFilterValidation.shape,
});

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(
      request,
      zod4(updateLabelSchemaWithPageAndFilter),
    );

    if (!form.valid) {
      return { form };
    }

    try {
      await tActions.label.update({ data: form.data, id: form.data.id });
    } catch (e) {
      locals.global.logger.error("Update Label Error", e);
      return message(form, "Error Updating Label");
    }
    redirect(302, form.data.prevPage);
  },
};
