import { authGuard } from '$lib/authGuard/authGuardConfig';
import { serverPageInfo } from '$lib/routes';
import { tActions } from '$lib/server/db/actions/tActions.js';
import { db } from '$lib/server/db/db';
import { logging } from '$lib/server/logging';

export const load = async (data) => {
	authGuard(data);
	const { current: pageInfo } = serverPageInfo(data.route.id, data);

	return { searchParams: pageInfo.searchParams };
};

export const actions = {
	update: async (data) => {
		const form = await data.request.formData();
		const journalId = form.get('journalId')?.toString();
		const action = form.get('action')?.toString();
		if (!journalId || !action) return;
		try {
			if (action === 'uncomplete') {
				await tActions.journal.markUncomplete(db, journalId);
			}
			if (action === 'complete') {
				await tActions.journal.markComplete(db, journalId);
			}
			if (action === 'reconcile') {
				await tActions.journal.updateJournals({
					db,
					filter: { id: journalId },
					journalData: { reconciled: true }
				});
			}
			if (action === 'unreconcile') {
				await tActions.journal.updateJournals({
					db,
					filter: { id: journalId },
					journalData: { reconciled: false }
				});
			}
			if (action === 'check') {
				await tActions.journal.updateJournals({
					db,
					filter: { id: journalId },
					journalData: { dataChecked: true }
				});
			}
			if (action === 'uncheck') {
				await tActions.journal.updateJournals({
					db,
					filter: { id: journalId },
					journalData: { dataChecked: false }
				});
			}
			return;
		} catch (error) {
			logging.error(error);
			return;
		}
	}
};
