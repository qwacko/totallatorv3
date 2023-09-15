import { skRoutes } from 'skroutes';
import { z } from 'zod';
import { tagFilterSchema } from './schema/tagSchema';

export const { serverPageInfo, pageInfo, urlGenerator, pageInfoStore } = skRoutes({
	errorURL: '/',
	config: {
		'/': {},
		'/(loggedIn)/backup': {},

		'/(loggedIn)/tags': {
			searchParamsValidation: tagFilterSchema.optional().catch({}).parse
		},
		'/(loggedIn)/tags/create': {},
		'/(loggedIn)/tags/[id]': {
			paramsValidation: z.object({ id: z.string() }).parse
		},
		'/(loggedIn)/tags/[id]/delete': {
			paramsValidation: z.object({ id: z.string() }).parse
		},

		'/(loggedIn)/users': {},
		'/(loggedIn)/users/create': {},
		'/(loggedIn)/users/[id]': { paramsValidation: z.object({ id: z.string() }).parse },
		'/(loggedIn)/users/[id]/delete': { paramsValidation: z.object({ id: z.string() }).parse },
		'/(loggedIn)/users/[id]/password': { paramsValidation: z.object({ id: z.string() }).parse },

		'/(loggedOut)/login': {},
		'/(loggedOut)/signup': {},
		'/(loggedOut)/firstUser': {},

		'/(loggedIn)/testFunctions': {}
	}
});
