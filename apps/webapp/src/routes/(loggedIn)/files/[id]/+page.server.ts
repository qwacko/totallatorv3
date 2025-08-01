import { redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";

import { tActions } from "@totallator/business-logic";
import { updateFileSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo } from "$lib/routes";
import { urlGenerator } from "$lib/routes";
import { fileFormActions } from "$lib/server/fileFormActions";

export const load = async (data) => {
  authGuard(data);
  const { current } = serverPageInfo(data.route.id, data);

  if (!current.params?.id) {
    throw new Error("No id provided");
  }

  const fileInfo = await tActions.file.list({
    filter: { idArray: [current.params.id] },
  });

  if (!fileInfo) {
    redirect(
      302,
      urlGenerator({ address: "/(loggedIn)/files", searchParamsValue: {} }).url,
    );
  }

  if (fileInfo.data.length === 0) {
    redirect(
      302,
      urlGenerator({ address: "/(loggedIn)/files", searchParamsValue: {} }).url,
    );
  }

  const form = await superValidate(
    { id: fileInfo.data[0].id, title: fileInfo.data[0].title || "" },
    zod4(updateFileSchema),
  );

  return {
    id: current.params.id,
    file: fileInfo.data[0],
    form,
  };
};

export const actions = fileFormActions;
