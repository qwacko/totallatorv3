import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";

import { tActions } from "@totallator/business-logic";
import { updateUserSchema } from "@totallator/shared";

import { authGuard } from "$lib/authGuard/authGuardConfig.js";
import { defaultJournalRedirect } from "$lib/helpers/defaultRedirect.js";

export const load = async (data) => {
  authGuard(data);

  const authUser = data.locals.user;
  if (!authUser) {
    return defaultJournalRedirect();
  }
  const targetUser = await tActions.user.get({
    userId: data.params.id,
  });
  if (!targetUser) {
    return defaultJournalRedirect();
  }

  const form = await superValidate(targetUser, zod4(updateUserSchema));

  return {
    canSetAdmin: tActions.user.canSetAdmin({
      userId: data.params.id,
      initiatingUser: authUser,
    }),
    canRemoveAdmin: tActions.user.canClearAdmin({
      userId: data.params.id,
      initiatingUser: authUser,
    }),
    canUpdateName: tActions.user.canUpdateInfo({
      userId: data.params.id,
      initiatingUser: authUser,
    }),
    canUpdatePassword: tActions.user.canUpdatePassword({
      userId: data.params.id,
      initiatingUser: authUser,
    }),
    form,
  };
};

export const actions = {
  updateInfo: async (data) => {
    const authUser = data.locals.user;
    if (!authUser) return;

    const form = await superValidate(data.request, zod4(updateUserSchema));

    if (!form.valid) {
      return { form };
    }

    try {
      await tActions.user.updateUserInfo({
        userId: data.params.id,
        userInfo: form.data,
        initiatingUser: authUser,
      });
    } catch (e) {
      data.locals.global.logger.error("updateInfoError : ", e);
      return message(form, "Error Updating User", { status: 401 });
    }

    return { form };
  },
  setAdmin: async (data) => {
    const authUser = data.locals.user;
    if (!authUser) return;
    const targetUser = await tActions.user.get({
      userId: data.params.id,
    });
    if (!targetUser) return;
    const canSetAdmin =
      authUser.admin && authUser.id !== targetUser.id && !targetUser.admin;

    if (!canSetAdmin) {
      return;
    }

    await tActions.user.setAdmin({
      userId: data.params.id,
      initiatingUser: authUser,
    });

    return;
  },
  removeAdmin: async (data) => {
    const authUser = data.locals.user;
    if (!authUser) return;
    const targetUser = await tActions.user.get({
      userId: data.params.id,
    });

    if (!targetUser) return;
    const canRemoveAdmin =
      authUser.admin && authUser.id !== targetUser.id && targetUser.admin;
    if (!canRemoveAdmin) {
      return;
    }

    await tActions.user.clearAdmin({
      userId: data.params.id,
      initiatingUser: authUser,
    });

    return;
  },
};
