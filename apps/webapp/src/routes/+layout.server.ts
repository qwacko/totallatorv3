import { getAdminCount, getUserCount } from "@totallator/business-logic";
import { getContext } from "@totallator/context";

import { dev } from "$app/environment";

import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  const context = getContext();

  // Ensure we have a global context before proceeding
  if (!context) {
    throw new Error("Global context not initialized");
  }

  const userCountValue = await getUserCount({ global: locals.global });
  const adminCountValue = await getAdminCount({ global: locals.global });
  return {
    user: locals.user,
    userCount: userCountValue,
    adminCount: adminCountValue,
    dev,
  };
};
