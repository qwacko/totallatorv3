import { redirect } from '@sveltejs/kit';

import { defaultJournalFilter } from '@totallator/shared';

import { urlGenerator } from '$lib/routes';

export const defaultJournalRedirect = () => {
	redirect(
		302,
		urlGenerator({
			address: '/(loggedIn)/journals',
			searchParamsValue: defaultJournalFilter()
		}).url
	);
};

export const defaultReportRedirect = defaultJournalRedirect;
