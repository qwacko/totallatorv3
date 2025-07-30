import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";

import { createFileSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { fileFormActions } from "$lib/server/fileFormActions";

export const load = async (data) => {
  authGuard(data);

  return {
    form: await superValidate(zod4(createFileSchema)),
  };
};

export const actions = fileFormActions;
