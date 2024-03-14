import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { importFilterToText } from '$lib/server/db/actions/helpers/import/importFilterToQuery';
import { tActions } from '$lib/server/db/actions/tActions.js';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	const { current } = serverPageInfo(data.route.id, data);

	const searchParams = current.searchParams || {};

	const imports = await tActions.import.list({ db, filter: searchParams });

	const filterText = await importFilterToText({ db, filter: searchParams });
	const needsRefresh = (await tActions.import.numberActive(db)) > 0;

	return {
		imports,
		searchParams,
		filterText,
		needsRefresh
	};
};
