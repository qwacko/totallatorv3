import { dbAdminCount, dbUserCount } from "@totallator/business-logic";

import { dev } from "$app/environment";

import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  const userCountValue = await dbUserCount(locals.db);
  const adminCountValue = await dbAdminCount(locals.db);
  return {
    user: locals.user,
    userCount: userCountValue,
    adminCount: adminCountValue,
    dev,
  };
};
