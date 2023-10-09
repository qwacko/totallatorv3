import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { tagFilterToText } from '$lib/server/db/actions/helpers/tagFilterToQuery.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';
import { redirect } from '@sveltejs/kit';

export const load = async (data) => {
	authGuard(data);
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const tags = await tActions.tag.list({
		db,
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 }
	});
	const redirectRequired = tags.page >= tags.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, tags.pageCount - 1);
		throw redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	return {
		tags,
		searchParams: pageInfo.searchParams,
		filterText: tagFilterToText(pageInfo.searchParams || { page: 0, pageSize: 10 })
	};
};
