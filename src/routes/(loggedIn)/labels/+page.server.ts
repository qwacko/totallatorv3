import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { defaultJournalFilter } from '$lib/schema/journalSchema';
import { labelFilterToText } from '$lib/server/db/actions/helpers/labelFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);

	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const labels = await tActions.label.list({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});

	const redirectRequired = labels.page >= labels.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, labels.pageCount - 1);
		throw redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const labelSummary = tActions.journal.summary({
		db,
		filter: { ...defaultJournalFilter(), label: pageInfo.searchParams }
	});

	return {
		labels,
		searchParams: pageInfo.searchParams,
		filterText: labelFilterToText(pageInfo.searchParams || { page: 0, pageSize: 10 }),
		labelSummary
	};
};
