import { tActions } from '$lib/server/db/actions/tActions';
import { db } from '$lib/server/db/db';

export const load = () => {
	return {
		filterDropdown: tActions.reusableFitler.listForDropdown({ db })
	};
};
