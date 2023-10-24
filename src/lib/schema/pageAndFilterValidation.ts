import { urlGenerator } from '$lib/routes.js';
import { defaultJournalFilter } from '$lib/schema/journalSchema.js';
import { z } from 'zod';

export const pageAndFilterValidation = z.object({
	filter: z.string(),
	prevPage: z
		.string()
		.optional()
		.default(
			urlGenerator({ address: '/(loggedIn)/journals', searchParamsValue: defaultJournalFilter() })
				.url
		),
	currentPage: z
		.string()
		.optional()
		.default(
			urlGenerator({ address: '/(loggedIn)/journals', searchParamsValue: defaultJournalFilter() })
				.url
		)
});
