import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { importMappingFilterToText } from '$lib/server/db/actions/helpers/importMappingFilterToQuery';
import { tActions } from '$lib/server/db/actions/tActions';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/db';

export const load = async (data) => {
	authGuard(data);
	const { current, updateParams } = serverPageInfo(data.route.id, data);

	const importMappings = await tActions.importMapping.list({
		db,
		filter: current.searchParams || {}
	});

	const redirectRequired = importMappings.page >= importMappings.pageCount;
	if (redirectRequired) {
		const targetPage = Math.max(0, importMappings.pageCount - 1);
		throw redirect(302, updateParams({ searchParams: { page: targetPage } }).url);
	}

	return {
		importMappings,
		filterText: importMappingFilterToText(current.searchParams || {}),
		searchParams: current.searchParams
	};
};
