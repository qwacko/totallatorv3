import { redirect } from "@sveltejs/kit";

import { tActions } from "@totallator/business-logic";
import { idSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo } from "$lib/routes";
import { logging } from "$lib/server/logging";

export const load = async (data) => {
  authGuard(data);
  const db = data.locals.db;
  const pageInfo = serverPageInfo(data.route.id, data);

  if (!pageInfo.current.params?.id) redirect(302, "/bills");

  const bill = await tActions.bill.getById(db, pageInfo.current.params?.id);
  if (!bill) redirect(302, "/bills");

  return {
    bill,
  };
};

export const actions = {
  default: async ({ params, locals }) => {
    const db = locals.db;
    try {
      await tActions.bill.delete(db, idSchema.parse(params));
    } catch (e) {
      logging.error("Delete Bill Error", e);
      return {};
    }
    redirect(302, "/bills");
  },
};
