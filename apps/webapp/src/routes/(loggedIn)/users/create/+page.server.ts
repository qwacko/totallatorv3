import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";

import { signupSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { createUserHandler } from "$lib/server/createUserHandler";

import type { Actions } from "./$types";

export const load = async (data) => {
  authGuard(data);

  const form = await superValidate(zod4(signupSchema));

  return { form };
};

export const actions: Actions = {
  default: async (request) => {
    const admin = request.locals.user?.admin;

    //Admin Cannot Do This
    if (!admin) {
      return {};
    }

    return createUserHandler({
      request,
      locals: request.locals,
      admin: false,
      setSession: false,
      cookies: request.cookies,
    });
  },
};
