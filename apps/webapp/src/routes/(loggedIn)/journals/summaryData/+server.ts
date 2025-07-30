import { text } from "@sveltejs/kit";
import superjson from "superjson";

import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo } from "$lib/routes";

export const GET = async (data) => {
  authGuard(data);
  const {
    current: { searchParams },
  } = serverPageInfo(data.route.id, data);

  const summaryData = await tActions.journalView.summary({
    db: data.locals.db,
    filter: searchParams,
  });

  return text(superjson.stringify(summaryData));
};
