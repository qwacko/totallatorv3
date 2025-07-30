import { redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";
import { updateBillSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { billPageAndFilterValidation } from "$lib/pageAndFilterValidation";
import { serverPageInfo } from "$lib/routes";
import { logging } from "$lib/server/logging";

export const load = async (data) => {
  authGuard(data);
  const db = data.locals.db;
  const pageInfo = serverPageInfo(data.route.id, data);

  if (!pageInfo.current.params?.id) redirect(302, "/bills");

  const bill = await tActions.bill.getById(db, pageInfo.current.params?.id);
  if (!bill) redirect(302, "/bills");
  const form = await superValidate(
    { id: bill.id, title: bill.title, status: bill.status },
    zod4(updateBillSchema),
  );

  return {
    bill,
    form,
  };
};

const updateBillSchemaWithPageAndFilter = z.object({
  ...updateBillSchema.shape,
  ...billPageAndFilterValidation.shape,
});

export const actions = {
  default: async ({ request, locals }) => {
    const db = locals.db;
    const form = await superValidate(
      request,
      zod4(updateBillSchemaWithPageAndFilter),
    );

    if (!form.valid) {
      return { form };
    }

    try {
      await tActions.bill.update({ db, data: form.data, id: form.data.id });
    } catch (e) {
      logging.error("Update Bill Error", e);
      return message(form, "Error Updating Bill");
    }
    redirect(302, form.data.prevPage);
  },
};
