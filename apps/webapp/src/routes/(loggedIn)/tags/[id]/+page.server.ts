import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import { updateTagSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { tagPageAndFilterValidation } from "$lib/pageAndFilterValidation.js";
import { serverPageInfo } from "$lib/routes.server";

export const _routeConfig = {
  paramsValidation: z.object({ id: z.string() }),
} satisfies SingleServerRouteConfig;

export const load = async (data) => {
  authGuard(data);
  const pageInfo = serverPageInfo(data.route.id, data);

  if (!pageInfo.current.params?.id) redirect(302, "/tags");

  const tag = await tActions.tag.getById(pageInfo.current.params?.id);
  if (!tag) redirect(302, "/tags");
  const form = await superValidate(
    { id: tag.id, title: tag.title, status: tag.status },
    zod4(updateTagSchema),
  );

  return {
    tag,
    form,
  };
};

const updateTagSchemaWithPageAndFilter = z.object({
  ...updateTagSchema.shape,
  ...tagPageAndFilterValidation.shape,
});

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(
      request,
      zod4(updateTagSchemaWithPageAndFilter),
    );

    if (!form.valid) {
      return { form };
    }

    try {
      await tActions.tag.update({ data: form.data, id: form.data.id });
    } catch (e) {
      locals.global.logger('tags').error({code: "TAG_0001", title: "Update Tag Error", error: e});
      return message(form, "Error Updating Tag");
    }
    redirect(302, form.data.prevPage);
  },
};
