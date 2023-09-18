import { skRoutes } from 'skroutes';
import { z } from 'zod';
import { tagFilterSchema } from './schema/tagSchema';
import { billFilterSchema as billFilterSchema } from './schema/billSchema';
import { budgetFilterSchema as budgetFilterSchema } from './schema/budgetSchema';
import { categoryFilterSchema } from './schema/categorySchema';
import { labelFilterSchema } from './schema/labelSchema';
import { accountFilterSchema } from './schema/accountSchema';

export const { serverPageInfo, pageInfo, urlGenerator, pageInfoStore } = skRoutes({
	errorURL: '/',
	config: {
		'/': {},
		'/(loggedIn)/backup': {},

		// Bulk Data Load
		// ----------------------------------------
		'/(loggedIn)/dev/bulkLoad': {},

		// Journals
		// ----------------------------------------
		'/(loggedIn)/journals': {
			searchParamsValidation: accountFilterSchema.optional().catch({}).parse
		},

		// Accounts
		// ----------------------------------------
		'/(loggedIn)/accounts': {
			searchParamsValidation: accountFilterSchema.optional().catch({}).parse
		},
		'/(loggedIn)/accounts/create': {},
		'/(loggedIn)/accounts/[id]': {
			paramsValidation: z.object({ id: z.string() }).parse
		},
		'/(loggedIn)/accounts/[id]/delete': {
			paramsValidation: z.object({ id: z.string() }).parse
		},
		// Labels
		// ----------------------------------------
		'/(loggedIn)/labels': {
			searchParamsValidation: labelFilterSchema.optional().catch({}).parse
		},
		'/(loggedIn)/labels/create': {},
		'/(loggedIn)/labels/[id]': {
			paramsValidation: z.object({ id: z.string() }).parse
		},
		'/(loggedIn)/labels/[id]/delete': {
			paramsValidation: z.object({ id: z.string() }).parse
		},
		// Tags
		// ----------------------------------------
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

		// Categories
		// ----------------------------------------
		'/(loggedIn)/categories': {
			searchParamsValidation: categoryFilterSchema.optional().catch({}).parse
		},
		'/(loggedIn)/categories/create': {},
		'/(loggedIn)/categories/[id]': {
			paramsValidation: z.object({ id: z.string() }).parse
		},
		'/(loggedIn)/categories/[id]/delete': {
			paramsValidation: z.object({ id: z.string() }).parse
		},

		// Bills
		// ----------------------------------------
		'/(loggedIn)/bills': {
			searchParamsValidation: billFilterSchema.optional().catch({}).parse
		},
		'/(loggedIn)/bills/create': {},
		'/(loggedIn)/bills/[id]': {
			paramsValidation: z.object({ id: z.string() }).parse
		},
		'/(loggedIn)/bills/[id]/delete': {
			paramsValidation: z.object({ id: z.string() }).parse
		},

		// Budgets
		// ----------------------------------------
		'/(loggedIn)/budgets': {
			searchParamsValidation: budgetFilterSchema.optional().catch({}).parse
		},
		'/(loggedIn)/budgets/create': {},
		'/(loggedIn)/budgets/[id]': {
			paramsValidation: z.object({ id: z.string() }).parse
		},
		'/(loggedIn)/budgets/[id]/delete': {
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
