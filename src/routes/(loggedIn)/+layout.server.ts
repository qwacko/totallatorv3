import { tActions } from '$lib/server/db/actions/tActions';
import { serverEnv } from '$lib/server/serverEnv';

export const load = async ({ locals }) => {
	const latestJournalUpdate = await tActions.journalView.getLatestUpdateDate({ db: locals.db });

	return {
		filterDropdown: await tActions.reusableFitler.listForDropdown({ db: locals.db }),
		reportDropdown: await tActions.report.listForDropdown({ db: locals.db }),
		enableDBLog: serverEnv.DBLOG_ENABLE,
		latestUpdate: latestJournalUpdate,
		dataUpdated: {
			journals: latestJournalUpdate,
			bills: (await tActions.bill.latestUpdate({ db: locals.db })).getTime() || 0,
			budgets: (await tActions.budget.latestUpdate({ db: locals.db })).getTime() || 0,
			tags: (await tActions.tag.latestUpdate({ db: locals.db })).getTime() || 0,
			labels: (await tActions.label.latestUpdate({ db: locals.db })).getTime() || 0,
			accounts: (await tActions.account.latestUpdate({ db: locals.db })).getTime() || 0,
			categories: (await tActions.category.latestUpdate({ db: locals.db })).getTime() || 0,
			importMappings: (await tActions.importMapping.latestUpdate({ db: locals.db })).getTime() || 0
		}
	};
};
