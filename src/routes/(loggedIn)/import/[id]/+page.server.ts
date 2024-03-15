import { tActions } from '$lib/server/db/actions/tActions.js';
import { importTable } from '$lib/server/db/postgres/schema';
import { logging } from '$lib/server/logging';

import { eq } from 'drizzle-orm';

export const actions = {
	reprocess: async ({ params, locals }) => {
		try {
			await tActions.import.reprocess({ db: locals.db, id: params.id });
		} catch (e) {
			logging.error('Reprocess Import Error', JSON.stringify(e, null, 2));
		}
	},
	triggerImport: async ({ params, locals }) => {
		try {
			await tActions.import.triggerImport({ db: locals.db, id: params.id });
		} catch (e) {
			logging.error('Import Trigger Error: ', JSON.stringify(e, null, 2));
			await locals.db
				.update(importTable)
				.set({ status: 'error', errorInfo: e })
				.where(eq(importTable.id, params.id));
		}
	}
};
