import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { db } from '$lib/server/db/db';

export const load = (data) => {
	authGuard(data);
	serverPageInfo(data.route.id, data);

	return {
		imports: tActions.import.list({ db })
	};
};
