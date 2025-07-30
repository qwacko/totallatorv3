import type { ServerLoadEvent } from "@sveltejs/kit";

import { serverEnv } from "./serverEnv";
import type { RouteId } from "$app/types";

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
