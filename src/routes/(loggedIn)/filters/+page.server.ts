import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { reusableFilterToText } from '$lib/server/db/actions/helpers/reusableFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const { current, updateParams } = serverPageInfo(data.route.id, data);

	const filterInfo = current.searchParams || {};

	const startTime = Date.now();

	const filters = await tActions.reusableFitler.list({ db, filter: filterInfo });

	const endTime = Date.now();
	console.log(`Reusable filter list took ${endTime - startTime}ms`);

	const redirectRequired = filters.page >= filters.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, filters.pageCount - 1);
		throw redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	return {
		filters,
		filterText: reusableFilterToText(current.searchParams || {}),
		searchParams: current.searchParams,
		streamed: {
			filters: await tActions.reusableFitler.updateAndList({ db, filter: filterInfo })
		}
	};
};
