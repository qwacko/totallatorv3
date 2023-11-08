import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { reusableFilterToText } from '$lib/server/db/actions/helpers/reusableFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const { current, updateParams } = serverPageInfo(data.route.id, data);

	const filters = await tActions.reusableFitler.list({ db, filter: current.searchParams || {} });

	const redirectRequired = filters.page >= filters.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, filters.pageCount - 1);
		throw redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	return {
		filters,
		filterText: reusableFilterToText(current.searchParams || {}),
		searchParams: current.searchParams
	};
};
