import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions.js';

export const load = async (data) => {
	authGuard(data);
	const db = data.locals.db;
	serverPageInfo(data.route.id, data);

	const imports = await tActions.import.list({ db });

	return {
		imports
	};
};
