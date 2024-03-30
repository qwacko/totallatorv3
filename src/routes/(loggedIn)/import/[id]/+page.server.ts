import { tActions } from '$lib/server/db/actions/tActions.js';
import { importTable } from '$lib/server/db/postgres/schema';
import { logging } from '$lib/server/logging';
import { redirect } from '@sveltejs/kit';
import { urlGenerator } from '$lib/routes';

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
	},
	clean: async ({ params, locals }) => {
		try {
			await tActions.import.clean({ db: locals.db, id: params.id });
		} catch (e) {
			logging.error('Clean Import Error', JSON.stringify(e, null, 2));
		}

		const importData = await tActions.import.get({ db: locals.db, id: params.id });

		if (!importData.importInfo) {
			return redirect(
				302,
				urlGenerator({ address: '/(loggedIn)/import', searchParamsValue: {} }).url
			);
		}
	},
	toggleAutoClean: async ({ params, locals }) => {
		const db = locals.db;
		const id = params.id;

		const importData = await tActions.import.get({ db, id });

		if (!importData.importInfo) {
			return;
		}

		await tActions.import.update({
			db,
			data: { id, autoClean: !importData.importInfo.import.autoClean }
		});
	},
	toggleAutoProcess: async ({ params, locals }) => {
		const db = locals.db;
		const id = params.id;

		const importData = await tActions.import.get({ db, id });

		if (!importData.importInfo) {
			return;
		}

		await tActions.import.update({
			db,
			data: { id, autoProcess: !importData.importInfo.import.autoProcess }
		});
	}
};
