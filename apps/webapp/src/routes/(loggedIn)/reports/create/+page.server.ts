import { redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import { reportPageValidation } from "$lib/pageAndFilterValidation";
import { createReportSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { urlGenerator } from "$lib/routes.js";
import { logging } from "$lib/server/logging";

export const load = async (data) => {
  authGuard(data);

  const form = await superValidate(zod4(createReportSchema));

  return { form };
};

const createReportSchemaWithPageAndFilter = z.object({
  ...createReportSchema.shape,
  ...reportPageValidation.shape,
});

export const actions = {
  default: async ({ request, locals }) => {
    const db = locals.db;
    const form = await superValidate(
      request,
      zod4(createReportSchemaWithPageAndFilter),
    );

    if (!form.valid) {
      return { form };
    }

    let newReportId = "";

    try {
      newReportId = await tActions.report.create({ db, data: form.data });
    } catch (e) {
      logging.error("Create Report Error", e);
      return message(
        form,
        "Error Creating Report, Possibly Group / Title Already Exists",
      );
    }
    redirect(
      302,
      urlGenerator({
        address: "/(loggedIn)/reports/[id]",
        paramsValue: { id: newReportId },
        searchParamsValue: {},
      }).url,
    );
  },
};
