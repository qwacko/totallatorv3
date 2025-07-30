import { fail, redirect } from "@sveltejs/kit";
import { setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import {
  importMappingCreateFormSchema,
  importMappingDetailSchema,
  importMappingDetailWithRefinementSchema,
} from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { serverPageInfo, urlGenerator } from "$lib/routes.js";
import { bufferingHelper } from "$lib/server/bufferingHelper.js";
import { logging } from "$lib/server/logging";

export const load = async (data) => {
  authGuard(data);
  serverPageInfo(data.route.id, data);
  bufferingHelper(data);

  const form = await superValidate(
    { title: "", configuration: "" },
    zod4(importMappingCreateFormSchema),
  );
  const detailForm = await superValidate({}, zod4(importMappingDetailSchema));

  return { form, detailForm };
};

const importMappingCreateFormSchemaWithPrevPage = z.object({
  ...importMappingCreateFormSchema.shape,
  prevPage: z.string().optional(),
});

export const actions = {
  default: async (data) => {
    const form = await superValidate(
      data.request,
      zod4(importMappingCreateFormSchemaWithPrevPage),
    );

    if (!form.valid) {
      return { form };
    }

    const detailFormData = importMappingDetailWithRefinementSchema.safeParse(
      JSON.parse(form.data.configuration),
    );

    if (!detailFormData.success) {
      return setError(
        form,
        "configuration",
        `Configuration Error : ${detailFormData.error.message}`,
      );
    }

    try {
      await tActions.importMapping.create({
        db: data.locals.db,
        data: {
          title: form.data.title,
          configuration: detailFormData.data,
          sampleData: form.data.sampleData,
        },
      });
    } catch (e) {
      logging.error("Import Mapping Create Error", JSON.stringify(e, null, 2));

      return fail(400, { message: "Unknown Error Creating Import Mapping" });
    }

    if (form.data.prevPage) {
      redirect(302, form.data.prevPage);
    }
    redirect(
      302,
      urlGenerator({
        address: "/(loggedIn)/importMapping",
        searchParamsValue: {},
      }).url,
    );
  },
};
