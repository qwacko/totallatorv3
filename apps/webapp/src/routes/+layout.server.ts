import { getAdminCount, getUserCount } from "@totallator/business-logic";

import { dev } from "$app/environment";

import type { LayoutServerLoad } from "./$types";
import { ensureInitialized } from "$lib/server/context";

export const load: LayoutServerLoad = async ({ locals }) => {
  const globalContext = await ensureInitialized();

  locals.global = globalContext;
  // Ensure we have a global context before proceeding
  if (!locals.global) {
    throw new Error("Global context not initialized in locals");
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
