import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import { updateCategorySchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { categoryPageAndFilterValidation } from "$lib/pageAndFilterValidation";
import { serverPageInfo } from "$lib/routes.server";

export const load = async (data) => {
  authGuard(data);
  const pageInfo = serverPageInfo(data.route.id, data);

  if (!pageInfo.current.params?.id) redirect(302, "/categories");

  const category = await tActions.category.getById(pageInfo.current.params?.id);
  if (!category) redirect(302, "/categories");
  const form = await superValidate(
    { id: category.id, title: category.title, status: category.status },
    zod4(updateCategorySchema),
  );

  return {
    category,
    form,
  };
};

const updateCategorySchemaWithPageAndFilter = z.object({
  ...updateCategorySchema.shape,
  ...categoryPageAndFilterValidation.shape,
});

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(
      request,
      zod4(updateCategorySchemaWithPageAndFilter),
    );

    if (!form.valid) {
      return { form };
    }

    try {
      await tActions.category.update({ data: form.data, id: form.data.id });
    } catch (e) {
      locals.global.logger('categories').error({code: "CAT_0001", title: "Update Category Error", error: e});
      return message(form, "Error Updating Category");
    }
    redirect(302, form.data.prevPage);
  },
};

export const _routeConfig = {
  paramsValidation: z.object({ id: z.string() }),
} satisfies SingleServerRouteConfig;
