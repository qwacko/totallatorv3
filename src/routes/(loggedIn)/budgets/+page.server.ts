import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { budgetFilterToText } from '$lib/server/db/actions/helpers/budgetFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const budgets = await tActions.budget.list({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});

	const redirectRequired = budgets.page >= budgets.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, budgets.pageCount - 1);
		throw redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	return {
		budgets,
		searchParams: pageInfo.searchParams,
		filterText: budgetFilterToText(pageInfo.searchParams || { page: 0, pageSize: 10 })
	};
};
