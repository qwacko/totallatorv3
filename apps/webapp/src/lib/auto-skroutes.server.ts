// Auto-generated server routes using skRoutes plugin
import { skRoutesServer } from "skroutes";
import { serverRouteConfig } from "./.generated/skroutes-server-config";

export const { serverPageInfo, urlGeneratorServer } = skRoutesServer({
  errorURL: "/",
  config: serverRouteConfig,
});