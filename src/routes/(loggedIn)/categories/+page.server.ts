import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { defaultAllJournalFilter } from '$lib/schema/journalSchema';
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

	const categoryIds = categories.data.map((item) => item.id);

	const journalSummaries = Promise.all(
		categoryIds.map(async (categoryId) => {
			const summary = await tActions.journal.summary({
				db,
				filter: {
					...defaultAllJournalFilter,
					category: { id: categoryId },
					account: { type: ['asset', 'liability'] }
				}
			});

			return { id: categoryId, sum: summary.sum, count: summary.count };
		})
	);

	return {
		categories,
		searchParams: pageInfo.searchParams,
		filterText: categoryFilterToText(pageInfo.searchParams || { page: 0, pageSize: 10 }),
		deferred: {
			journalSummaries
		}
	};
};
