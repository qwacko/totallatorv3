import { type Cookies, fail, redirect } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";

import { tActions } from "@totallator/business-logic";
import { signupSchema } from "@totallator/shared";

export const createUserHandler = async ({
  request,
  locals,
  admin,
  setSession = false,
  cookies,
}: {
  request: RequestEvent;
  locals: App.Locals;
  admin: boolean;
  setSession?: boolean;
  cookies: Cookies;
}) => {
  const form = await superValidate(request, zod4(signupSchema));

  if (!form.valid) {
    return fail(400, { form });
  }

  try {
    const user = await tActions.user.createUser({
      db: locals.db,
      username: form.data.username.toLowerCase(),
      password: form.data.password,
      admin,
    });

    if (!user) {
      throw new Error("User not created");
    }

    if (setSession) {
      const token = tActions.auth.generateSessionToken();
      const session = await tActions.auth.createSession(
        locals.db,
        token,
        user.id,
      );
      tActions.auth.setSessionTokenCookie(request, token, session.expiresAt);
    }
  } catch (e) {
    locals.global.logger.error("Error creating user", e);
    return setError(
      form,
      "username",
      "Error creating user. Username possibly already exists.",
    );
  }
  // redirect to
  // make sure you don't throw inside a try/catch block!
  redirect(302, "/user");
};
