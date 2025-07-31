import { redirect } from "@sveltejs/kit";

import { tActions } from "@totallator/business-logic";

export const load = async ({ params, locals }) => {
  // Fetch users from database
  const currentUser = await tActions.user.get({
    db: locals.db,
    userId: params.id,
  });

  if (!currentUser) {
    redirect(302, "/users");
  }

  return { currentUser };
};
