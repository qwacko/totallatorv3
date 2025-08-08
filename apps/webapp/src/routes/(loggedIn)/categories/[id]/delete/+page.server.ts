import { redirect } from "@sveltejs/kit";

import { tActions } from "@totallator/business-logic";
import { idSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo } from "$lib/routes.server";

export const load = async (data) => {
  authGuard(data);
  const pageInfo = serverPageInfo(data.route.id, data);

  if (!pageInfo.current.params?.id) redirect(302, "/categories");

  const category = await tActions.category.getById(pageInfo.current.params?.id);
  if (!category) redirect(302, "/categories");

  return {
    category,
  };
};

export const actions = {
  default: async ({ params, locals }) => {
    try {
      await tActions.category.delete(idSchema.parse(params));
    } catch (e) {
      locals.global.logger.error("Delete Category Error", e);
      return {};
    }
    redirect(302, "/categories");
  },
};
