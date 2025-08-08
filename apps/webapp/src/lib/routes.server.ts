import { skRoutesServer } from "skroutes";

import { skConfig } from "./routeConfig";

export const { serverPageInfo, urlGeneratorServer } = skRoutesServer({
  errorURL: "/",
  config: skConfig,
});
