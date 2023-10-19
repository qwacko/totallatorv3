import { skRoutes } from 'skroutes';
import { z } from 'zod';
import { tagFilterSchema } from './schema/tagSchema';
import { billFilterSchema as billFilterSchema } from './schema/billSchema';
import { budgetFilterSchema as budgetFilterSchema } from './schema/budgetSchema';
import { categoryFilterSchema } from './schema/categorySchema';
import { labelFilterSchema } from './schema/labelSchema';
import { accountFilterSchema } from './schema/accountSchema';
import {
	defaultJournalFilter,
	defaultPivotConfig,
	journalFilterSchema,
	journalPivotTableSchema
} from './schema/journalSchema';
import { idSchema } from './schema/idSchema';
import { downloadTypeSchema } from './schema/downloadTypeSchema';

export const { serverPageInfo, pageInfo, urlGenerator, pageInfoStore } = skRoutes({
	errorURL: '/',
	config: {
		'/': {},
		'/(loggedIn)/backup': {
			searchParamsValidation: z
				.object({ page: z.coerce.number().optional().default(0) })
				.optional()
				.catch({ page: 0 }).parse
		},

		// Bulk Data Load
		// ----------------------------------------
		'/(loggedIn)/dev/bulkLoad': {},

		// Imports
		// ----------------------------------------
		'/(loggedIn)/import': {},
		'/(loggedIn)/import/create': {},
		'/(loggedIn)/import/[id]': { paramsValidation: idSchema.parse },
		'/(loggedIn)/import/[id]/forget': { paramsValidation: idSchema.parse },
		'/(loggedIn)/import/[id]/delete': { paramsValidation: idSchema.parse },
		'/(loggedIn)/import/[id]/deleteLinked': { paramsValidation: idSchema.parse },

		// Journals
		// ----------------------------------------
		'/(loggedIn)/pivot': {
			searchParamsValidation: journalPivotTableSchema.optional().catch(defaultPivotConfig).parse
		},
		'/(loggedIn)/journals': {
			searchParamsValidation: journalFilterSchema.optional().catch(defaultJournalFilter).parse
		},
		'/(loggedIn)/journals/download': {
			searchParamsValidation: journalFilterSchema
				.merge(downloadTypeSchema)
				.optional()
				.catch(defaultJournalFilter).parse
		},
		'/(loggedIn)/journals/delete': {
			searchParamsValidation: journalFilterSchema.optional().catch(defaultJournalFilter).parse
		},
		'/(loggedIn)/journals/bulkEdit': {
			searchParamsValidation: journalFilterSchema.optional().catch(defaultJournalFilter).parse
		},
		'/(loggedIn)/journals/clone': {
			searchParamsValidation: journalFilterSchema.optional().catch(defaultJournalFilter).parse
		},
		'/(loggedIn)/journals/[id]/edit': {
			searchParamsValidation: journalFilterSchema.optional().catch(defaultJournalFilter).parse,
			paramsValidation: z.object({ id: z.string() }).parse
		},

		// Accounts
		// ----------------------------------------
		'/(loggedIn)/accounts': {
			searchParamsValidation: accountFilterSchema.optional().catch({}).parse
		},
		'/(loggedIn)/accounts/download': {
			searchParamsValidation: accountFilterSchema.merge(downloadTypeSchema).optional().catch({})
				.parse
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
		'/(loggedIn)/labels/download': {
			searchParamsValidation: labelFilterSchema.merge(downloadTypeSchema).optional().catch({}).parse
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
		'/(loggedIn)/tags/download': {
			searchParamsValidation: tagFilterSchema.merge(downloadTypeSchema).optional().catch({}).parse
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
		'/(loggedIn)/categories/download': {
			searchParamsValidation: categoryFilterSchema.merge(downloadTypeSchema).optional().catch({})
				.parse
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
		'/(loggedIn)/bills/download': {
			searchParamsValidation: billFilterSchema.merge(downloadTypeSchema).optional().catch({}).parse
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
		'/(loggedIn)/budgets/download': {
			searchParamsValidation: budgetFilterSchema.merge(downloadTypeSchema).optional().catch({})
				.parse
		},
		'/(loggedIn)/budgets/create': {},
		'/(loggedIn)/budgets/[id]': {
			paramsValidation: z.object({ id: z.string() }).parse
		},
		'/(loggedIn)/budgets/[id]/delete': {
			paramsValidation: z.object({ id: z.string() }).parse
		},

		'/(loggedIn)/users': {
			searchParamsValidation: z
				.object({ page: z.coerce.number().optional().default(0) })
				.optional()
				.catch({ page: 0 }).parse
		},
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
