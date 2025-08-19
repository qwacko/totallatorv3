import { redirect } from "@sveltejs/kit";
import type { SingleServerRouteConfig } from "skroutes";
import * as z from "zod";

import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { failWrapper } from "$lib/helpers/customEnhance";
import {
  serverPageInfo,
  urlGeneratorServer as urlGenerator,
} from "$lib/routes.server";

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
      locals.global.logger('backup').error({code: "BCK_0001", title: "Error Locking Backup", error: e});
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
      locals.global.logger('backup').error({code: "BCK_0002", title: "Error Unlocking Backup", error: e});
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
      locals.global.logger('backup').error({code: "BCK_0003", title: "Error Updating Backup Title", error: e});
    }
    return;
  },
  restore: async ({ request, params, locals }) => {
    const id = params.id;
    if (!id) {
      return failWrapper("No ID provided");
    }

    try {
      await tActions.backup.restoreTrigger({
        id,
        includeUsers: false,
        userId: locals.user?.id
      });
    } catch (e) {
      locals.global.logger('backup').error({code: "BCK_0004", title: "Error Triggering Backup Restore", error: e});
      return failWrapper("Error Starting Backup Restore");
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
      locals.global.logger('backup').error({code: "BCK_0005", title: "Error Deleting Backup", error: e});
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

export const _routeConfig = {
  paramsValidation: z.object({ id: z.string() }),
} satisfies SingleServerRouteConfig;
