import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import { actionHelpers } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo } from "$lib/routes.server";

const updateLLMProviderSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  apiUrl: z
    .string()
    .min(1, "Provider is required")
    .refine((value) => {
      // Must be a predefined provider ID
      return actionHelpers.isPredefinedProvider(value);
    }, "Must be a supported provider"),
  apiKey: z.string().optional(), // Optional for updates - keep existing if not provided
  defaultModel: z.string().min(1, "Default model is required"),
  enabled: z.boolean(),
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

  // Don't include the actual API key in the form for security
  const form = await superValidate(
    {
      id: provider.id,
      title: provider.title,
      apiUrl: provider.apiUrl,
      defaultModel: provider.defaultModel || "",
      enabled: provider.enabled,
      apiKey: "", // Empty for security
    },
    zod4(updateLLMProviderSchema),
  );

  return {
    provider,
    form,
    predefinedProviders: actionHelpers.getAllPredefinedProviders(),
  };
};

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(updateLLMProviderSchema));

    if (!form.valid) {
      return { form };
    }

    try {
      const { prevPage, currentPage, apiKey, ...updateData } = form.data;

      // Only include API key in update if it was provided
      const dataToUpdate =
        apiKey && apiKey.trim() !== "" ? { ...updateData, apiKey } : updateData;

      await tActions.llm.update({
        data: dataToUpdate,
        id: form.data.id,
      });
    } catch (e) {
      locals.global.logger.error("Update LLM Provider Error", e);
      return message(form, "Error Updating LLM Provider");
    }
    redirect(302, form.data.prevPage || "/llm/providers");
  },
};

export const _routeConfig = {
  paramsValidation: z.object({ id: z.string() }),
} satisfies SingleServerRouteConfig;
