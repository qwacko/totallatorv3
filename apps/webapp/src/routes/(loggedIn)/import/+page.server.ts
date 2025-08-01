import { importFilterToText } from "@totallator/business-logic";
import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo } from "$lib/routes";

export const load = async (data) => {
  authGuard(data);
  const db = data.locals.db;
  const { current } = serverPageInfo(data.route.id, data);

  const searchParams = current.searchParams || {};

  const imports = await tActions.import.list({ filter: searchParams });

  const filterText = await importFilterToText({ db, filter: searchParams });
  const needsRefresh = (await tActions.import.numberActive()) > 0;

  return {
    imports,
    searchParams,
    filterText,
    needsRefresh,
  };
};
