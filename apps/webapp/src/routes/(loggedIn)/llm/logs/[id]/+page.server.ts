import { error } from "@sveltejs/kit";

import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";

export const load = async (data) => {
  authGuard(data);
  const db = data.locals.db;
  const { id } = data.params;

  // Get the specific LLM log
  const log = await tActions.llmLog.getById({ db, id });

  if (!log) {
    error(404, "LLM log not found");
  }

  return {
    log,
  };
};
