import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { defaultJournalFilter } from '$lib/schema/journalSchema';
import { categoryFilterToText } from '$lib/server/db/actions/helpers/categoryFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const categories = await tActions.category.list({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});
	const redirectRequired = categories.page >= categories.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, categories.pageCount - 1);
		throw redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const categorySummary = tActions.journal.summary({
		db,
		filter: { ...defaultJournalFilter(), category: pageInfo.searchParams }
	});

	return {
		categories,
		searchParams: pageInfo.searchParams,
		filterText: categoryFilterToText(pageInfo.searchParams || { page: 0, pageSize: 10 }),
		categorySummary,
		categoryDropdowns: tActions.category.listForDropdown({ db })
	};
};
