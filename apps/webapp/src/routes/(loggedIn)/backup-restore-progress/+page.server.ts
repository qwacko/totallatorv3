import { error, redirect } from "@sveltejs/kit";

import { getBackupRestoreProgress } from "@totallator/business-logic";

import { urlGeneratorServer } from "$lib/routes.server";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  try {
    const progress = await getBackupRestoreProgress();

    if (!progress) {
      throw error(404, "No backup restore in progress");
    }

    return {
      progress,
    };
  } catch (err) {
    console.error("Failed to load backup restore progress:", err);
    redirect(302, urlGeneratorServer({ address: "/(loggedIn)/backup" }).url);
  }
};
