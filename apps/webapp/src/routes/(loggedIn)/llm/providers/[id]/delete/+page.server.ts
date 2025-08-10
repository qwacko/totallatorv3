import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo } from "$lib/routes.server";

const deleteLLMProviderSchema = z.object({
  id: z.string(),
  prevPage: z.string().optional(),
  currentPage: z.string().optional(),
});

export const load = async (data) => {
  authGuard(data);
  const pageInfo = serverPageInfo(data.route.id, data);

  if (!pageInfo.current.params?.id) redirect(302, "/llm/providers");

  const provider = await tActions.llm.getById({
    id: pageInfo.current.params?.id,
  });
  if (!provider) redirect(302, "/llm/providers");

  const form = await superValidate(
    { id: provider.id },
    zod4(deleteLLMProviderSchema),
  );

  return {
    provider,
    form,
  };
};

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(deleteLLMProviderSchema));

    if (!form.valid) {
      return { form };
    }

    try {
      await tActions.llm.delete({
        id: form.data.id,
      });
    } catch (e) {
      locals.global.logger.error("Delete LLM Provider Error", e);
      return message(form, "Error Deleting LLM Provider");
    }
    redirect(302, form.data.prevPage || "/llm/providers");
  },
};

export const _routeConfig = {
  paramsValidation: z.object({ id: z.string() }),
} satisfies SingleServerRouteConfig;
