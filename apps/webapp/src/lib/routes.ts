import { skRoutes } from "skroutes";

import { skConfig } from "./routeConfig";

export const { pageInfo, urlGenerator } = skRoutes({
  errorURL: "/",
  config: skConfig,
});
