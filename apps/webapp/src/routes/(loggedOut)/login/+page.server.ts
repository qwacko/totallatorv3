import { fail, redirect } from "@sveltejs/kit";
import { setMessage, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";

import { tActions, userActions } from "@totallator/business-logic";
import { loginSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { logging } from "$lib/server/logging";
import { serverEnv } from "$lib/server/serverEnv";

import type { Actions } from "./$types";

export const load = async (data) => {
  authGuard(data);
  const form = await superValidate(zod4(loginSchema));

  return { form, enableSignup: serverEnv.ALLOW_SIGNUP };
};

export const actions: Actions = {
  default: async (request) => {
    const { locals } = request;
    const form = await superValidate(request, zod4(loginSchema));

    if (!form.valid) {
      return fail(400, { form });
    }
    try {
      const user = await userActions.checkLogin({
        db: locals.db,
        username: form.data.username.toLowerCase(),
        password: form.data.password,
      });

      if (!user) {
        throw new Error("User not found");
      }

      const token = tActions.auth.generateSessionToken();
      const session = await tActions.auth.createSession(locals.db, token, user.id);
      tActions.auth.setSessionTokenCookie(request, token, session.expiresAt);
    } catch (e) {
      logging.error("Error Logging In", e);
      return setMessage(form, "Incorrect username or password", {
        status: 400,
      });
    }
    redirect(302, "/");
  },
};
