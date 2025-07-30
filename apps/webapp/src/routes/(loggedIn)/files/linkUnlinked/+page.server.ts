import { redirect } from "@sveltejs/kit";

import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo, urlGenerator } from "$lib/routes";
import { fileFormActions } from "$lib/server/fileFormActions.js";

export const load = async (data) => {
  authGuard(data);
  const { current } = serverPageInfo(data.route.id, data);

  if (!current.searchParams) {
    redirect(
      302,
      urlGenerator({ address: "/(loggedIn)/files", searchParamsValue: {} }).url,
    );
  }

  const titleInfo = await tActions.file.getLinkedText({
    db: data.locals.db,
    items: current.searchParams,
  });

  const unlinkedItems = await tActions.file.listWithoutPagination({
    db: data.locals.db,
    filter: {
      linked: false,
    },
  });

  return {
    unlinkedItems,
    searchParams: current.searchParams,
    titleInfo,
  };
};

export const actions = fileFormActions;
