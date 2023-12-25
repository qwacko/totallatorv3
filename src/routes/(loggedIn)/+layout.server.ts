import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';

export const load = async () => {
	return {
		filterDropdown: await tActions.reusableFitler.listForDropdown({ db })
	};
};
