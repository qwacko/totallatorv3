import { redirect } from "@sveltejs/kit";

import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo, urlGeneratorServer } from "$lib/routes.server";

export const load = async (data) => {
  authGuard(data);
  const { current: pageInfo } = serverPageInfo(data.route.id, data);

  if (!pageInfo.params?.id) {
    redirect(
      302,
      urlGeneratorServer({
        address: "/(loggedIn)/import",
        searchParamsValue: {},
      }).url,
    );
  }

  const info = await tActions.import.get({ id: pageInfo.params.id });

  if (!info?.importInfo) {
    redirect(
      302,
      urlGeneratorServer({
        address: "/(loggedIn)/import",
        searchParamsValue: {},
      }).url,
    );
  }

  const canDelete = await tActions.import.canDelete({
    id: pageInfo.params.id,
  });

  return {
    id: pageInfo.params.id,
    info,
    canDelete,
    streaming: {
      data: await tActions.import.getDetail({ id: pageInfo.params.id }),
    },
  };
};
