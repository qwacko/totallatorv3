import { tActions } from '$lib/server/db/actions/tActions';

export const load = async ({ locals }) => {
	return {
		filterDropdown: await tActions.reusableFitler.listForDropdown({ db: locals.db }),
		reportDropdown: await tActions.report.listForDropdown({ db: locals.db })
	};
};
