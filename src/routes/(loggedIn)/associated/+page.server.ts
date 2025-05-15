import { authGuard } from '$lib/authGuard/authGuardConfig.js';
import { serverPageInfo } from '$lib/routes.js';
import { tActions } from '$lib/server/db/actions/tActions';
import { redirect } from '@sveltejs/kit';
import { associatedInfoFilterToText } from '$lib/server/db/actions/helpers/associatedInfo/associatedInfoFilterToQuery';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const { current: pageInfo, updateParams } = serverPageInfo(data.route.id, data);

	const searchParams = pageInfo.searchParams || { page: 0, pageSize: 10 };

	const associatedInfo = await tActions.associatedInfo.list({
		db,
		filter: searchParams
	});

	const redirectRequired = associatedInfo.page >= associatedInfo.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, associatedInfo.pageCount - 1);
		redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	const filterText = await associatedInfoFilterToText({
		filter: pageInfo.searchParams || { page: 0, pageSize: 10 },
		db
	});

	return {
		data: associatedInfo,
		searchParams: pageInfo.searchParams,
		filterText
	};
};
