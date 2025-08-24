import { skRoutesServer } from 'skroutes';

export const {
	serverPageInfo,
	urlGeneratorServer,
	loadConfig: loadConfigServer
} = skRoutesServer({
	errorURL: '/',
	config: async () => (await import('./.generated/skroutes-server-config')).serverRouteConfig
});
