import { redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";

import { tActions, userActions } from "@totallator/business-logic";
import { updatePasswordSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";

const passwordSchema = updatePasswordSchema;

export type passwordSchemaType = typeof passwordSchema;

export const load = async (requestData) => {
  authGuard(requestData);

  const form = await superValidate(zod4(passwordSchema));

  return { form };
};

const passwordSchemaRefined = passwordSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  },
);

export const actions = {
  default: async ({ locals, params, request }) => {
    const form = await superValidate(request, zod4(passwordSchemaRefined));
    const currentUser = locals.user;
    const targetUserId = params.id;

    if (!form.valid) {
      return { form };
    }

    //Admin Cannot Do This
    if (!currentUser) {
      return message(form, "You're not logged in");
    }

    if (!(currentUser.id === targetUserId) && !currentUser.admin) {
      return message(form, "You're not allowed to do this");
    }

    const targetUser = await tActions.user.get({ db: locals.db, userId: targetUserId });
    

    if (!targetUser) {
      return message(form, "User Not Found");
    }

    try {
      await userActions.updatePassword({
        db: locals.db,
        userId: targetUserId,
        password: form.data.password,
      });
    } catch (e) {
      return message(form, "Error Updating Password", { status: 400 });
    }

    redirect(302, `/users/${targetUserId}`);
  },
};
