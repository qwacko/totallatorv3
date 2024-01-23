import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo, urlGenerator } from '$lib/routes';
import { defaultAllJournalFilter } from '$lib/schema/journalSchema.js';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const pageInfo = serverPageInfo(data.route.id, data);

	if (!pageInfo.current.params) {
		redirect(
			302,
			urlGenerator({
				address: '/(loggedIn)/journals',
				searchParamsValue: defaultAllJournalFilter()
			}).url
		);
	}

	const elementData = await tActions.report.getReportElementData({
		db,
		id: pageInfo.current.params.id
	});

	if (!elementData) {
		redirect(
			302,
			urlGenerator({
				address: '/(loggedIn)/journals',
				searchParamsValue: defaultAllJournalFilter()
			}).url
		);
	}

	return { elementData };
};
