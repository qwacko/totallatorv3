import { tActions } from '$lib/server/db/actions/tActions';
import { serverEnv } from '$lib/server/serverEnv';
import { dropdownItems } from '$lib/server/dropdownItems.js';

export const load = async ({ locals }) => {
	return {
		filterDropdown: await tActions.reusableFitler.listForDropdown({ db: locals.db }),
		reportDropdown: await tActions.report.listForDropdown({ db: locals.db }),
		enableDBLog: serverEnv.DBLOG_ENABLE,
		latestUpdate: await tActions.journalView.getLatestUpdateDate({ db: locals.db }),
		dropdownInfo: dropdownItems({ db: locals.db })
	};
};
