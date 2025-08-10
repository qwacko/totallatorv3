import { fail, redirect } from "@sveltejs/kit";
import { message, setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import { createImportSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { urlGenerator } from "$lib/routes.js";

export const load = async (data) => {
  authGuard(data);

  const form = await superValidate(zod4(createImportSchema));

  return { form };
};

export const actions = {
  create: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(createImportSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    let newId: undefined | string = undefined;

    try {
      if (form.data.importMappingId) {
        const result = await tActions.importMapping.getById({
          id: form.data.importMappingId,
        });
        if (!result) {
          return setError(
            form,
            "importMappingId",
            `Mapping ${form.data.importMappingId} Not Found`,
          );
        }
      }
      newId = await tActions.import.store({
        data: form.data,
      });
    } catch (e) {
      locals.global.logger.error(
        "Import Create Error",
        JSON.stringify(e, null, 2),
      );
      const parsedError = z.object({ message: z.string() }).safeParse(e);
      if (parsedError.success) {
        return message(form, parsedError.data.message, { status: 400 });
      }
      return message(form, "Unknown Error Loading File", { status: 400 });
    }
    if (newId) {
      if (form.data.autoProcess) {
        redirect(
          302,
          urlGenerator({ address: "/(loggedIn)/import", searchParamsValue: {} })
            .url,
        );
      } else {
        redirect(
          302,
          urlGenerator({
            address: "/(loggedIn)/import/[id]",
            paramsValue: { id: newId },
          }).url,
        );
      }
    }
    return message(form, "Unknown Error. Not Processed");
  },
};
