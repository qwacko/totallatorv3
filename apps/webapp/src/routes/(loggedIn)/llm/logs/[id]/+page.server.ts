import { error } from "@sveltejs/kit";

import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";

export const load = async (data) => {
  authGuard(data);
  const { id } = data.params;

  // Get the specific LLM log
  const log = await tActions.llmLog.getById({ id });

  if (!log) {
    error(404, "LLM log not found");
  }

  return {
    log,
  };
};
