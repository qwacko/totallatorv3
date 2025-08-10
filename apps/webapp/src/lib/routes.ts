import { skRoutes } from "skroutes";

export const {
  pageInfo,
  urlGenerator,
  loadConfig: loadConfigClient,
} = skRoutes({
  errorURL: "/",
  config: async () =>
    (await import("./.generated/skroutes-client-config")).clientRouteConfig,
});
