import { redirect } from "@sveltejs/kit";

import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { failWrapper } from "$lib/helpers/customEnhance";
import { serverPageInfo, urlGenerator } from "$lib/routes";

export const load = async (data) => {
  authGuard(data);
  const { current } = serverPageInfo(data.route.id, data);

  if (!current.params?.id) {
    redirect(
      302,
      urlGenerator({
        address: "/(loggedIn)/backup",
        searchParamsValue: { page: 1 },
      }).url,
    );
  }

  const backupInformation = await tActions.backup.getBackupInfo({
    id: current.params.id,
  });

  if (!backupInformation) {
    redirect(
      302,
      urlGenerator({
        address: "/(loggedIn)/backup",
        searchParamsValue: { page: 1 },
      }).url,
    );
  }

  return {
    information: backupInformation.information,
    backupInformation,
  };
};

export const actions = {
  lock: async ({ request, params, locals }) => {
    const id = params.id;
    if (!id) {
      return;
    }
    try {
      await tActions.backup.lock({ id });
    } catch (e) {
      locals.global.logger.error("Error Locking Backup: " + e);
    }
    return;
  },
  unlock: async ({ request, params, locals }) => {
    const id = params.id;
    if (!id) {
      return;
    }
    try {
      await tActions.backup.unlock({ id });
    } catch (e) {
      locals.global.logger.error("Error Unlocking Backup: " + e);
    }
    return;
  },
  updateTitle: async ({ request, params, locals }) => {
    const id = params.id;
    if (!id) {
      return;
    }
    const formData = await request.formData();
    const title = formData.get("title") as string;
    if (!title) {
      return;
    }
    try {
      await tActions.backup.updateTitle({ id, title });
    } catch (e) {
      locals.global.logger.error("Error Updating Backup Title: " + e);
    }
    return;
  },
  restore: async ({ request, params, locals }) => {
    const id = params.id;
    if (!id) {
      return failWrapper("No ID provided");
    }

    try {
      await tActions.backup.restoreBackup({
        id,
        includeUsers: false,
      });
    } catch (e) {
      locals.global.logger.error("Error Restoring Backup: " + e);
      return failWrapper("Error Restoring Backup");
    }
    redirect(
      302,
      urlGenerator({
        address: "/(loggedIn)/backup",
        searchParamsValue: { page: 0 },
      }).url,
    );
  },
  delete: async ({ request, params, locals }) => {
    const id = params.id;
    if (!id) {
      return failWrapper("No filename provided");
    }

    try {
      await tActions.backup.deleteBackup({ id });
    } catch (e) {
      locals.global.logger.error("Error Deleting Backup: " + e);
      return failWrapper("Error Deleting Backup");
    }

    redirect(
      302,
      urlGenerator({
        address: "/(loggedIn)/backup",
        searchParamsValue: { page: 0 },
      }).url,
    );
  },
};
