import { goto } from '$app/navigation';
import { skGuard, type RouteConfig } from 'skguard';

type UserValidationOutput = {
	admin: boolean;
	user: boolean;
};

const adminOnlyConfig: RouteConfig<UserValidationOutput> = {
	check: (data) => (data.admin ? undefined : data.user ? '/' : '/login')
};
// const userOnlyConfig: RouteConfig = { nonUserRedirect: '/login' };
const openConfig: RouteConfig<UserValidationOutput> = { check: () => undefined };
const loggedOutConfig: RouteConfig<UserValidationOutput> = {
	check: (data) => (data.user ? '/' : undefined)
};

const POSTAllowUsers = (data: UserValidationOutput) => (data.user ? undefined : 'Not Authorised');

const POSTAllowNonUsers = (data: UserValidationOutput) =>
	data.user ? 'Not Authorised' : undefined;
const POSTAllowAdminOnly = (data: UserValidationOutput) =>
	data.admin ? undefined : 'Not Authorised';

export const { backend: authGuard, frontend: authGuardFrontend } = skGuard({
	routeConfig: {
		'/': {
			...openConfig,
			POSTCheck: {
				testFunction: POSTAllowAdminOnly,
				logout: POSTAllowUsers
			}
		},

		'/(open)/params': { ...openConfig, POSTCheck: { testAction: POSTAllowUsers } },

		'/(loggedIn)/backup': adminOnlyConfig,

		'/(loggedIn)/users': adminOnlyConfig,
		'/(loggedIn)/users/create': adminOnlyConfig,
		'/(loggedIn)/users/[id]': adminOnlyConfig,
		'/(loggedIn)/users/[id]/delete': adminOnlyConfig,
		'/(loggedIn)/users/[id]/password': adminOnlyConfig,

		'/(loggedOut)/login': {
			...loggedOutConfig,
			POSTCheck: {
				default: POSTAllowNonUsers
			}
		},
		'/(loggedOut)/signup': {
			...loggedOutConfig,
			POSTCheck: {
				default: POSTAllowNonUsers
			}
		},
		'/(loggedOut)/firstUser': {
			...loggedOutConfig,
			POSTCheck: {
				default: POSTAllowNonUsers
			}
		},

		'/(loggedIn)/testFunctions': { ...adminOnlyConfig, POSTCheck: { default: POSTAllowUsers } }
	},
	validationBackend: (data) => {
		return {
			admin: data.locals.user?.admin || false,
			user: data.locals.user !== undefined
		};
	},
	errorFuncFrontend: (status, body) => {
		console.log('Routing Error : ', { status, body });
	},
	redirectFuncFrontend: (_, location) => {
		console.log('Redirecting On Frontend');
		goto(location);
	}
});

export type AuthRouteOptions = Parameters<typeof authGuard>[0]['route'];
