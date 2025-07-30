import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { defaultReportRedirect } from "$lib/helpers/defaultRedirect";
import { serverPageInfo } from "$lib/routes";
import { logging } from "$lib/server/logging";

export const load = async (data) => {
  authGuard(data);
  const db = data.locals.db;
  const pageInfo = serverPageInfo(data.route.id, data);

  if (!pageInfo.current.params) return defaultReportRedirect();

  const reportInfo = await tActions.report.getSimpleReportConfig({
    db,
    id: pageInfo.current.params.id,
  });

  if (!reportInfo) return defaultReportRedirect();

  return { reportInfo };
};

export const actions = {
  default: async (data) => {
    const id = data.params.id;
    const db = data.locals.db;

    try {
      await tActions.report.delete({ db, id });
      defaultReportRedirect();
    } catch (e) {
      logging.error("Error deleting report", e);
    }
  },
};
