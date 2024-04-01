import { authGuard } from '$lib/authGuard/authGuardConfig';
import { tActions } from '$lib/server/db/actions/tActions';
import { serverPageInfo } from '$lib/routes';

export const load = async (request) => {
	authGuard(request);
	const { current } = serverPageInfo(request.route.id, request);

	const filter = current.searchParams || {};

	const autoImportList = await tActions.autoImport.list({
		db: request.locals.db,
		filter
	});

	return {
		list: autoImportList,
		filter
	};
};
