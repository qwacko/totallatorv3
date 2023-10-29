import { dev } from '$app/environment';
import { goto } from '$app/navigation';
import { skGuard, type RouteConfig } from 'skguard';

type UserValidationOutput = {
	admin: boolean;
	user: boolean;
};

const authRedirectAddress = '/journals';
const unauthRedirectAddress = '/login';

const homepageRedirect: RouteConfig<UserValidationOutput> = {
	check: (data) => (data.user ? authRedirectAddress : unauthRedirectAddress)
};

const adminOnlyConfig: RouteConfig<UserValidationOutput> = {
	check: (data) =>
		data.admin ? undefined : data.user ? authRedirectAddress : unauthRedirectAddress
};
const userOnlyConfig: RouteConfig<UserValidationOutput> = {
	check: (data) => (data.user ? undefined : unauthRedirectAddress)
};
const openConfig: RouteConfig<UserValidationOutput> = { check: () => undefined };
const loggedOutConfig: RouteConfig<UserValidationOutput> = {
	check: (data) => (data.user ? authRedirectAddress : undefined)
};
const devOnly: RouteConfig<UserValidationOutput> = {
	check: (data) => (data.admin && dev ? undefined : '/')
};
const devOnlyPOST = (data: UserValidationOutput) =>
	data.admin && dev ? undefined : 'Not Authorised';

const POSTAllowUsers = (data: UserValidationOutput) => (data.user ? undefined : 'Not Authorised');

const POSTAllowNonUsers = (data: UserValidationOutput) =>
	data.user ? 'Not Authorised' : undefined;
const POSTAllowAdminOnly = (data: UserValidationOutput) =>
	data.admin ? undefined : 'Not Authorised';

export const { backend: authGuard, frontend: authGuardFrontend } = skGuard({
	routeConfig: {
		'/': homepageRedirect,

		'/(open)/params': { ...openConfig, POSTCheck: { testAction: POSTAllowUsers } },

		'/(loggedIn)/backup': {
			...adminOnlyConfig,
			POSTCheck: {
				backup: POSTAllowAdminOnly,
				restore: POSTAllowAdminOnly,
				delete: POSTAllowAdminOnly
			}
		},

		// Dev Actions
		// ----------------------------------------
		'/(loggedIn)/dev/bulkLoad': {
			...devOnly,
			POSTCheck: {
				bulkAddJournals: devOnlyPOST,
				bulkAddAccounts: devOnlyPOST,
				bulkAddTags: devOnlyPOST,
				bulkAddBills: devOnlyPOST,
				bulkAddBudgets: devOnlyPOST,
				bulkAddCategories: devOnlyPOST,
				bulkAddLabels: devOnlyPOST,
				deleteUnusedJournals: devOnlyPOST,
				deleteUnusedAccounts: devOnlyPOST,
				deleteUnusedTags: devOnlyPOST,
				deleteUnusedBills: devOnlyPOST,
				deleteUnusedBudgets: devOnlyPOST,
				deleteUnusedCategories: devOnlyPOST,
				deleteUnusedLabels: devOnlyPOST
			}
		},

		// Imports
		// ----------------------------------------
		'/(loggedIn)/import': { ...adminOnlyConfig, POSTCheck: { update: POSTAllowAdminOnly } },
		'/(loggedIn)/import/create': { ...adminOnlyConfig, POSTCheck: { create: POSTAllowAdminOnly } },
		'/(loggedIn)/import/[id]': {
			...adminOnlyConfig,
			POSTCheck: {
				reprocess: POSTAllowAdminOnly,
				doImport: POSTAllowAdminOnly,
				updateImportType: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/import/[id]/forget': {
			...adminOnlyConfig,
			POSTCheck: {
				default: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/import/[id]/delete': {
			...adminOnlyConfig,
			POSTCheck: {
				default: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/import/[id]/deleteLinked': {
			...adminOnlyConfig,
			POSTCheck: {
				default: POSTAllowAdminOnly
			}
		},

		// Journals
		// ----------------------------------------
		'/(loggedIn)/journals': { ...adminOnlyConfig, POSTCheck: { update: POSTAllowAdminOnly } },
		'/(loggedIn)/journals/download': { ...adminOnlyConfig },
		'/(loggedIn)/journals/[id]/edit': {
			...adminOnlyConfig,
			POSTCheck: { update: POSTAllowAdminOnly }
		},
		'/(loggedIn)/journals/create': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/journals/delete': {
			...adminOnlyConfig,
			POSTCheck: { delete: POSTAllowAdminOnly }
		},
		'/(loggedIn)/journals/bulkEdit': {
			...adminOnlyConfig,
			POSTCheck: { updateState: POSTAllowAdminOnly, update: POSTAllowAdminOnly }
		},

		'/(loggedIn)/journals/clone': {
			...adminOnlyConfig,
			POSTCheck: { clone: POSTAllowAdminOnly }
		},

		// Accounts
		// ----------------------------------------
		'/(loggedIn)/accounts': {
			...adminOnlyConfig,
			POSTCheck: {
				update: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/accounts/download': adminOnlyConfig,
		'/(loggedIn)/accounts/[id]': { ...adminOnlyConfig, POSTCheck: { default: POSTAllowAdminOnly } },
		'/(loggedIn)/accounts/[id]/delete': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/accounts/create': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},

		// Labels
		// ----------------------------------------
		'/(loggedIn)/labels': {
			...adminOnlyConfig,
			POSTCheck: {
				update: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/labels/download': adminOnlyConfig,
		'/(loggedIn)/labels/[id]': { ...adminOnlyConfig, POSTCheck: { default: POSTAllowAdminOnly } },
		'/(loggedIn)/labels/[id]/delete': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/labels/create': { ...adminOnlyConfig, POSTCheck: { default: POSTAllowAdminOnly } },

		// Tags
		// ----------------------------------------
		'/(loggedIn)/tags': {
			...adminOnlyConfig,
			POSTCheck: {
				update: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/tags/download': adminOnlyConfig,
		'/(loggedIn)/tags/[id]': { ...adminOnlyConfig, POSTCheck: { default: POSTAllowAdminOnly } },
		'/(loggedIn)/tags/[id]/delete': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/tags/create': { ...adminOnlyConfig, POSTCheck: { default: POSTAllowAdminOnly } },

		// Categories
		// ----------------------------------------
		'/(loggedIn)/categories': {
			...adminOnlyConfig,
			POSTCheck: {
				update: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/categories/download': adminOnlyConfig,
		'/(loggedIn)/categories/[id]': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/categories/[id]/delete': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/categories/create': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},

		// Bills
		// ----------------------------------------
		'/(loggedIn)/bills': {
			...adminOnlyConfig,
			POSTCheck: {
				update: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/bills/download': adminOnlyConfig,
		'/(loggedIn)/bills/[id]': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/bills/[id]/delete': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/bills/create': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},

		// Budgets
		// ----------------------------------------
		'/(loggedIn)/budgets': {
			...adminOnlyConfig,
			POSTCheck: {
				update: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/budgets/download': adminOnlyConfig,
		'/(loggedIn)/budgets/[id]': {
			'/(loggedIn)/budgets': adminOnlyConfig,
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/budgets/[id]/delete': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/budgets/create': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},

		'/(loggedIn)/users': {
			...userOnlyConfig,
			POSTCheck: {
				setAdmin: POSTAllowAdminOnly,
				removeAdmin: POSTAllowAdminOnly,
				updateName: POSTAllowUsers
			}
		},
		'/(loggedIn)/users/create': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/users/[id]': {
			...userOnlyConfig,
			POSTCheck: {
				setAdmin: POSTAllowAdminOnly,
				removeAdmin: POSTAllowAdminOnly,
				updateName: POSTAllowUsers
			}
		},
		'/(loggedIn)/users/[id]/delete': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/users/[id]/password': {
			...userOnlyConfig,
			POSTCheck: {
				default: POSTAllowUsers
			}
		},

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
