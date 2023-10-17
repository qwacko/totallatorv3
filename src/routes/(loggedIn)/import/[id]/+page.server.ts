import { tActions } from '$lib/server/db/actions/tActions.js';
import { db } from '$lib/server/db/db';
import { importTable } from '$lib/server/db/schema';

import { eq } from 'drizzle-orm';

export const actions = {
	reprocess: async ({ params }) => {
		try {
			await tActions.import.reprocess({ db, id: params.id });
		} catch (e) {
			console.log(e);
		}
	},
	doImport: async ({ params }) => {
		try {
			await tActions.import.doImport({ db, id: params.id });
		} catch (e) {
			console.log(e);
			await db
				.update(importTable)
				.set({ status: 'error', errorInfo: e })
				.where(eq(importTable.id, params.id));
		}
	}
};
