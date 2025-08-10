import type { ServerLoadEvent } from "@sveltejs/kit";

import type { RouteId } from "$app/types";

import { serverEnv } from "./serverEnv";

export const bufferingHelper = <
  ServerData extends ServerLoadEvent<
    Partial<Record<string, string>>,
    Record<string, unknown>,
    RouteId | null
  >,
>(
  loadData: ServerData,
) => {
  if (serverEnv.DISABLE_BUFFERING) {
    loadData.setHeaders({
      "X-Accel-Buffering": "no",
    });
  }
};
