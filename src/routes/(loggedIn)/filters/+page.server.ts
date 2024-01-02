import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { bufferingHelper } from '$lib/server/bufferingHelper.js';
import { reusableFilterToText } from '$lib/server/db/actions/helpers/journal/reusableFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const { current, updateParams } = serverPageInfo(data.route.id, data);
	bufferingHelper(data);

	const filterInfo = current.searchParams || {};

	const filters = await tActions.reusableFitler.list({ db, filter: filterInfo });

	const redirectRequired = filters.page >= filters.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, filters.pageCount - 1);
		redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const filterText = await reusableFilterToText(current.searchParams || {});

	return {
		filters,
		filterText,
		searchParams: current.searchParams,
		streamed: {
			filters: tActions.reusableFitler.updateAndList({
				db,
				filter: filterInfo,
				maximumTime: 2000
			})
		}
	};
};
