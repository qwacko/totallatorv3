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

const notesActions = {
	addNote: POSTAllowAdminOnly,
	deleteNote: POSTAllowAdminOnly
};

const filesActions = {
	addFile: POSTAllowAdminOnly,
	deleteFile: POSTAllowAdminOnly,
	updateFile: POSTAllowAdminOnly
};

export const { backend: authGuard, frontend: authGuardFrontend } = skGuard({
	routeConfig: {
		'/': homepageRedirect,

		'/(open)/params': { ...openConfig, POSTCheck: { testAction: POSTAllowUsers } },

		'/(loggedIn)/backup': {
			...adminOnlyConfig,
			POSTCheck: {
				...notesActions,
				...filesActions,
				refresh: POSTAllowAdminOnly,
				tidyBackups: POSTAllowAdminOnly,
				backup: POSTAllowAdminOnly,
				backupUncompressed: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/backup/[id]': {
			...adminOnlyConfig,
			POSTCheck: {
				restore: POSTAllowAdminOnly,
				delete: POSTAllowAdminOnly,
				lock: POSTAllowAdminOnly,
				unlock: POSTAllowAdminOnly,
				updateTitle: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/backup/import': {
			...adminOnlyConfig,
			POSTCheck: {
				import: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/backup/download/[filename]': { ...adminOnlyConfig },

		// Settings Actions
		// ----------------------------------------
		'/(loggedIn)/settings': {
			...adminOnlyConfig
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
				bulkAddReusableFilters: devOnlyPOST,
				deleteUnusedJournals: devOnlyPOST,
				deleteUnusedAccounts: devOnlyPOST,
				deleteUnusedTags: devOnlyPOST,
				deleteUnusedBills: devOnlyPOST,
				deleteUnusedBudgets: devOnlyPOST,
				deleteUnusedCategories: devOnlyPOST,
				deleteUnusedLabels: devOnlyPOST,
				deleteReusableFilters: devOnlyPOST
			}
		},

		// Import Mappings
		// ----------------------------------------
		'/(loggedIn)/importMapping': { ...adminOnlyConfig, POSTCheck: { default: POSTAllowAdminOnly } },
		'/(loggedIn)/importMapping/create': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/importMapping/[id]': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/importMapping/[id]/delete': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},

		// Imports
		// ----------------------------------------
		'/(loggedIn)/import': {
			...adminOnlyConfig,
			POSTCheck: { update: POSTAllowAdminOnly, ...notesActions, ...filesActions }
		},
		'/(loggedIn)/import/create': { ...adminOnlyConfig, POSTCheck: { create: POSTAllowAdminOnly } },
		'/(loggedIn)/import/[id]': {
			...adminOnlyConfig,
			POSTCheck: {
				reprocess: POSTAllowAdminOnly,
				triggerImport: POSTAllowAdminOnly,
				clean: POSTAllowAdminOnly,
				toggleAutoProcess: POSTAllowAdminOnly,
				toggleAutoClean: POSTAllowAdminOnly
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
		'/(loggedIn)/journals': {
			...adminOnlyConfig,
			POSTCheck: {
				...notesActions,
				...filesActions,
				update: POSTAllowAdminOnly,
				updateJournal: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/journals/summaryData': { ...adminOnlyConfig },
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

		// Dropdown Data Collection
		// ----------------------------------------
		'/(loggedIn)/dropdowns/accounts': {
			...userOnlyConfig
		},
		'/(loggedIn)/dropdowns/bills': {
			...userOnlyConfig
		},
		'/(loggedIn)/dropdowns/budgets': {
			...userOnlyConfig
		},
		'/(loggedIn)/dropdowns/categories': {
			...userOnlyConfig
		},
		'/(loggedIn)/dropdowns/tags': {
			...userOnlyConfig
		},
		'/(loggedIn)/dropdowns/labels': {
			...userOnlyConfig
		},
		'/(loggedIn)/dropdowns/importMappings': {
			...userOnlyConfig
		},

		// Automatic Imports
		// ----------------------------------------
		'/(loggedIn)/autoImport': {
			...adminOnlyConfig,
			POSTCheck: {
				...notesActions,
				...filesActions,
				clone: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/autoImport/[id]/[filename]': { ...adminOnlyConfig },
		'/(loggedIn)/autoImport/create': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/autoImport/[id]': {
			...adminOnlyConfig,
			POSTCheck: {
				updateSampleData: POSTAllowAdminOnly,
				testConnection: POSTAllowAdminOnly,
				update: POSTAllowAdminOnly,
				enableDisable: POSTAllowAdminOnly,
				getData: POSTAllowAdminOnly,
				trigger: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/autoImport/[id]/delete': {
			...adminOnlyConfig,
			POSTCheck: {
				default: POSTAllowAdminOnly
			}
		},

		// Filters
		// ----------------------------------------
		'/(loggedIn)/filters': {
			...adminOnlyConfig,
			POSTCheck: {
				...notesActions,
				...filesActions,
				update: POSTAllowAdminOnly,
				refreshAll: POSTAllowAdminOnly,
				refreshSome: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/filters/create': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/filters/[id]': {
			...adminOnlyConfig,
			POSTCheck: {
				update: POSTAllowAdminOnly,
				updateFilter: POSTAllowAdminOnly,
				updateChange: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/filters/[id]/apply': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/filters/[id]/delete': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},

		// Accounts
		// ----------------------------------------
		'/(loggedIn)/accounts': {
			...adminOnlyConfig,
			POSTCheck: {
				...notesActions,
				...filesActions,
				update: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/accounts/download': adminOnlyConfig,
		'/(loggedIn)/accounts/bulkEdit': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
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
				...notesActions,
				...filesActions,
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
				...notesActions,
				...filesActions,
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
				...notesActions,
				...filesActions,
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
				...notesActions,
				...filesActions,
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
				...notesActions,
				...filesActions,
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

		// Reports
		// ---------------------------------------
		'/(loggedIn)/reports': {
			...adminOnlyConfig,
			POSTCheck: {
				...notesActions,
				...filesActions,
				update: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/reports/[id]': {
			...adminOnlyConfig,
			POSTCheck: {
				updateLayout: POSTAllowAdminOnly,
				updateFilter: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/reports/[id]/delete': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/reports/create': {
			...adminOnlyConfig,
			POSTCheck: { default: POSTAllowAdminOnly }
		},
		'/(loggedIn)/reports/element/[id]': {
			...adminOnlyConfig,
			POSTCheck: {
				addFilter: POSTAllowAdminOnly,
				updateFilter: POSTAllowAdminOnly,
				removeFilter: POSTAllowAdminOnly,
				update: POSTAllowAdminOnly,
				createConfig: POSTAllowAdminOnly,
				updateConfig: POSTAllowAdminOnly,
				updateConfigFilter: POSTAllowAdminOnly,
				addConfigFilter: POSTAllowAdminOnly,
				removeConfigFilter: POSTAllowAdminOnly
			}
		},
		'/(loggedIn)/reports/element/[id]/[item]': {
			...adminOnlyConfig,
			POSTCheck: {
				update: POSTAllowAdminOnly
			}
		},

		// Query Logging
		// ----------------------------------------
		'/(loggedIn)/queries/grouped': {
			...adminOnlyConfig
		},
		'/(loggedIn)/queries/list': {
			...adminOnlyConfig
		},

		// Users
		// ----------------------------------------

		'/(loggedIn)/logout': {
			...userOnlyConfig,
			POSTCheck: {
				default: POSTAllowUsers
			}
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
				updateInfo: POSTAllowUsers
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

		// Files
		// ----------------------------------------
		'/(loggedIn)/files': {
			...userOnlyConfig,
			POSTCheck: {
				checkFiles: POSTAllowUsers
			}
		},
		'/(loggedIn)/files/create': {
			...adminOnlyConfig,
			POSTCheck: {
				...filesActions
			}
		},
		'/(loggedIn)/files/linkUnlinked': {
			...adminOnlyConfig,
			POSTCheck: {
				...filesActions
			}
		},
		'/(loggedIn)/files/linkToTransaction/[id]': {
			...adminOnlyConfig,
			POSTCheck: {
				...filesActions
			}
		},
		'/(loggedIn)/files/[id]': {
			...adminOnlyConfig,
			POSTCheck: {
				...filesActions
			}
		},
		'/(loggedIn)/files/[id]/delete': {
			...adminOnlyConfig,
			POSTCheck: {
				...filesActions
			}
		},
		'/(loggedIn)/files/[id]/image/[filename]': {
			...userOnlyConfig
		},
		'/(loggedIn)/files/[id]/[filename]': {
			...userOnlyConfig
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

		'/(loggedIn)/testFunctions': { ...adminOnlyConfig, POSTCheck: { default: POSTAllowUsers } },

		'/(loggedIn)/test': {
			...adminOnlyConfig
		}
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
