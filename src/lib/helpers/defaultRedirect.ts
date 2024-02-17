import { redirect } from '@sveltejs/kit';
import { urlGenerator } from '$lib/routes';
import { defaultJournalFilter } from '$lib/schema/journalSchema.js';

export const defaultJournalRedirect = () => {
	redirect(
		302,
		urlGenerator({ address: '/(loggedIn)/journals', searchParamsValue: defaultJournalFilter() }).url
	);
};

export const defaultReportRedirect = defaultJournalRedirect;
